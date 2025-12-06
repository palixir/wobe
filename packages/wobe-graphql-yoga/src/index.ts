import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type Plugin,
	type YogaServerOptions,
} from 'graphql-yoga'
import {
	GraphQLError,
	NoSchemaIntrospectionCustomRule,
	type ValidationRule,
} from 'graphql'
import type {
	Context,
	MaybePromise,
	Wobe,
	WobePlugin,
	WobeResponse,
} from 'wobe'

export type GraphqlYogaContext =
	| MaybePromise<Record<string, unknown>>
	| ((context: any) => MaybePromise<unknown>)

export interface GraphqlYogaPluginOptions {
	graphqlMiddleware?: (
		resolve: () => Promise<Response>,
		res: WobeResponse,
	) => Promise<Response>
	allowGetRequests?: boolean
	isProduction?: boolean
	allowIntrospection?: boolean
	maxDepth?: number
	maxCost?: number
	maxRequestSizeBytes?: number
	timeoutMs?: number
	allowedOperationNames?: string[]
	allowMultipleOperations?: boolean
	onRequestResolved?: (input: {
		operationName?: string | null
		success: boolean
		status: number
		durationMs: number
	}) => void
	rateLimiter?: (context: Context) => MaybePromise<Response | undefined>
}

export const WobeGraphqlYogaPlugin = ({
	graphqlMiddleware,
	allowGetRequests = false,
	isProduction = false,
	allowIntrospection,
	maxDepth,
	maxCost,
	maxRequestSizeBytes,
	timeoutMs,
	allowedOperationNames,
	allowMultipleOperations = false,
	onRequestResolved,
	rateLimiter,
	...options
}: {
	schema?: GraphQLSchemaWithContext<Record<string, any>>
	typeDefs?: string
	context?: GraphqlYogaContext
	resolvers?: Record<string, any>
} & Omit<YogaServerOptions<any, any>, 'context'> &
	GraphqlYogaPluginOptions): WobePlugin => {
	const graphqlEndpoint = options?.graphqlEndpoint || '/graphql'
	const plugins: Plugin[] = [...(options.plugins || [])]

	const shouldDisableIntrospection =
		isProduction && allowIntrospection !== true

	const validationPlugins: Plugin[] = []

	if (maxDepth) {
		validationPlugins.push({
			onValidate({ addValidationRule }) {
				addValidationRule(createDepthLimitRule(maxDepth))
			},
		})
	}

	if (maxCost) {
		validationPlugins.push({
			onValidate({ addValidationRule }) {
				addValidationRule(createCostLimitRule(maxCost))
			},
		})
	}

	if (!allowMultipleOperations || (allowedOperationNames?.length || 0) > 0) {
		validationPlugins.push({
			onValidate({ addValidationRule }) {
				addValidationRule(
					createOperationConstraintsRule({
						allowedOperationNames,
						allowMultipleOperations,
					}),
				)
			},
		})
	}

	if (shouldDisableIntrospection) {
		plugins.push({
			onValidate({ addValidationRule }) {
				addValidationRule(NoSchemaIntrospectionCustomRule)
			},
		})
	}

	const yoga = createYoga<{
		request: Request
		response: WobeResponse
	}>({
		...options,
		plugins: [...plugins, ...validationPlugins],
		graphiql: options.graphiql ?? !isProduction,
		maskedErrors: options.maskedErrors ?? isProduction,
		schema:
			options.schema ||
			createSchema({
				typeDefs: options.typeDefs || '',
				resolvers: options.resolvers || {},
			}),
	})

	const handleGraphQLRequest = async (context: Context) => {
		if (maxRequestSizeBytes) {
			const contentLength = context.request.headers.get('content-length')
			if (contentLength && Number(contentLength) > maxRequestSizeBytes) {
				return new Response('Request Entity Too Large', { status: 413 })
			}
		}

		if (rateLimiter) {
			const rateLimiterResult = await rateLimiter(context)
			if (rateLimiterResult instanceof Response) return rateLimiterResult
		}

		const start = performance.now()

		const getResponse = async () => {
			if (!graphqlMiddleware) return yoga.handle(context.request, context)

			return graphqlMiddleware(
				async () => yoga.handle(context.request, context),
				context.res,
			)
		}

		const response = await resolveWithTimeout(getResponse, timeoutMs)

		for (const [key, value] of context.res.headers.entries()) {
			if (key === 'set-cookie') {
				response.headers.append('set-cookie', value)
				continue
			}

			response.headers.set(key, value)
		}

		onRequestResolved?.({
			operationName: context.params?.operationName,
			success: response.ok,
			status: response.status,
			durationMs: performance.now() - start,
		})

		return response
	}

	return (wobe: Wobe<unknown>) => {
		if (allowGetRequests) {
			wobe.get(graphqlEndpoint, async (context) =>
				handleGraphQLRequest(context),
			)
		}

		wobe.post(graphqlEndpoint, async (context) =>
			handleGraphQLRequest(context),
		)
	}
}

const createDepthLimitRule = (maxDepth: number): ValidationRule => {
	return (context) => {
		const checkDepth = (depth: number) => {
			if (depth > maxDepth) {
				context.reportError(
					new GraphQLError(
						`Query is too deep: ${depth} > max depth ${maxDepth}`,
					),
				)
			}
		}

		const traverse = (
			selectionSet: any,
			depth: number,
			visitedFragments: Set<string>,
		) => {
			checkDepth(depth)

			for (const selection of selectionSet.selections || []) {
				if (selection.selectionSet) {
					traverse(
						selection.selectionSet,
						depth + 1,
						visitedFragments,
					)
					continue
				}

				if (selection.kind === 'FragmentSpread') {
					const name = selection.name.value
					if (visitedFragments.has(name)) continue
					visitedFragments.add(name)
					const fragment = context.getFragment(name)
					if (fragment) {
						traverse(
							fragment.selectionSet,
							depth + 1,
							visitedFragments,
						)
					}
				}
			}
		}

		return {
			OperationDefinition(node) {
				traverse(node.selectionSet, 1, new Set())
			},
		}
	}
}

const createCostLimitRule = (maxCost: number): ValidationRule => {
	return (context) => {
		let totalCost = 0

		const countSelections = (
			selectionSet: any,
			visitedFragments: Set<string>,
		): number => {
			let cost = 0
			for (const selection of selectionSet.selections || []) {
				cost += 1
				if (selection.selectionSet) {
					cost += countSelections(
						selection.selectionSet,
						visitedFragments,
					)
					continue
				}
				if (selection.kind === 'FragmentSpread') {
					const name = selection.name.value
					if (visitedFragments.has(name)) continue
					visitedFragments.add(name)
					const fragment = context.getFragment(name)
					if (fragment) {
						cost += countSelections(
							fragment.selectionSet,
							visitedFragments,
						)
					}
				}
			}
			return cost
		}

		return {
			OperationDefinition(node) {
				const visitedFragments = new Set<string>()
				totalCost += countSelections(
					node.selectionSet,
					visitedFragments,
				)
			},
			Document: {
				leave() {
					if (totalCost > maxCost) {
						context.reportError(
							new GraphQLError(
								`Query is too expensive: ${totalCost} > max cost ${maxCost}`,
							),
						)
					}
				},
			},
		}
	}
}

const createOperationConstraintsRule = ({
	allowedOperationNames,
	allowMultipleOperations,
}: {
	allowedOperationNames?: string[]
	allowMultipleOperations: boolean
}): ValidationRule => {
	return (context) => {
		const seenOperations: string[] = []

		return {
			OperationDefinition(node) {
				const name = node.name?.value
				if (name) {
					seenOperations.push(name)
					if (
						allowedOperationNames &&
						allowedOperationNames.length > 0 &&
						!allowedOperationNames.includes(name)
					) {
						context.reportError(
							new GraphQLError(
								`Operation "${name}" is not allowed in this endpoint.`,
							),
						)
					}
				}
			},
			Document: {
				leave() {
					if (!allowMultipleOperations && seenOperations.length > 1) {
						context.reportError(
							new GraphQLError(
								'Multiple operations are not allowed in this endpoint.',
							),
						)
					}
				},
			},
		}
	}
}

const resolveWithTimeout = async (
	resolve: () => Promise<Response>,
	timeoutMs: number | undefined,
) => {
	if (!timeoutMs || timeoutMs <= 0) return resolve()

	let timeoutId: ReturnType<typeof setTimeout> | undefined

	const timeoutPromise = new Promise<Response>((resolveTimeout) => {
		timeoutId = setTimeout(
			() =>
				resolveTimeout(
					new Response('Request Timeout', { status: 504 }),
				),
			timeoutMs,
		)
	})

	const response = await Promise.race([resolve(), timeoutPromise])

	if (timeoutId) clearTimeout(timeoutId)

	return response
}
