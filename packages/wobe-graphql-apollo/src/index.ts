import { ApolloServer, type ApolloServerOptions } from '@apollo/server'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { GraphQLError, type ValidationRule } from 'graphql'
import type {
	Wobe,
	MaybePromise,
	WobePlugin,
	WobeResponse,
	Context,
} from 'wobe'

export type GraphQLApolloContext =
	| MaybePromise<Record<string, unknown>>
	| ((context: any) => MaybePromise<unknown>)

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

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

export interface GraphQLApolloPluginOptions {
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

export const WobeGraphqlApolloPlugin = async ({
	options,
	graphqlEndpoint = '/graphql',
	graphqlMiddleware,
	context: apolloContext,
	isProduction,
	allowGetRequests = false,
	allowIntrospection,
	maxDepth,
	maxCost,
	maxRequestSizeBytes,
	timeoutMs,
	allowedOperationNames,
	allowMultipleOperations = false,
	onRequestResolved,
	rateLimiter,
}: {
	options: ApolloServerOptions<any>
	graphqlEndpoint?: string
	context?: GraphQLApolloContext
	isProduction?: boolean
} & GraphQLApolloPluginOptions): Promise<WobePlugin> => {
	const introspection =
		options.introspection ??
		(allowIntrospection === true ? true : !isProduction)

	const validationRules: ValidationRule[] = [
		...(options.validationRules || []),
		...(maxDepth ? [createDepthLimitRule(maxDepth)] : []),
		...(maxCost ? [createCostLimitRule(maxCost)] : []),
		...(!allowMultipleOperations || (allowedOperationNames?.length || 0) > 0
			? [
					createOperationConstraintsRule({
						allowedOperationNames,
						allowMultipleOperations,
					}),
				]
			: []),
	]

	const server = new ApolloServer({
		...options,
		introspection,
		validationRules,
		plugins: [
			...(options?.plugins || []),
			...(isProduction
				? []
				: [
						ApolloServerPluginLandingPageLocalDefault({
							footer: false,
						}),
					]),
		],
	})

	await server.start()

	return (wobe: Wobe<unknown>) => {
		const getResponse = async (context: Context) => {
			const fetchEndpoint = async (request: Request) => {
				let requestBody: any

				if (maxRequestSizeBytes) {
					const contentLength = request.headers.get('content-length')
					if (
						contentLength &&
						Number(contentLength) > maxRequestSizeBytes
					) {
						return new Response('Request Entity Too Large', {
							status: 413,
						})
					}
				}

				if (rateLimiter) {
					const rateLimitResult = await rateLimiter(context)
					if (rateLimitResult instanceof Response)
						return rateLimitResult
				}

				const start = performance.now()

				if (request.method !== 'GET') {
					requestBody = await request.json()
				}

				const res = await server.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body:
							request.method === 'GET'
								? request.body
								: requestBody,
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
					context: async () => {
						if (!apolloContext) return context

						if (typeof apolloContext === 'function') {
							const apolloContextResult =
								await apolloContext(context)

							if (
								apolloContextResult &&
								typeof apolloContextResult === 'object'
							)
								return { ...context, ...apolloContextResult }

							return context
						}

						return { ...context, ...apolloContext }
					},
				})

				if (res.body.kind === 'complete') {
					const response = new Response(res.body.string, {
						status: res.status ?? 200,
						// @ts-expect-error
						headers: res.headers,
					})

					onRequestResolved?.({
						operationName: requestBody?.operationName,
						success: response.ok,
						status: response.status,
						durationMs: performance.now() - start,
					})

					return response
				}

				return new Response()
			}

			const resolve = async () => fetchEndpoint(context.request)

			if (!graphqlMiddleware)
				return resolveWithTimeout(resolve, timeoutMs)

			return graphqlMiddleware(async () => {
				const response = await resolveWithTimeout(resolve, timeoutMs)

				return response
			}, context.res)
		}

		if (allowGetRequests) {
			wobe.get(graphqlEndpoint, async (context) => {
				const response = await getResponse(context)

				for (const [key, value] of context.res.headers.entries()) {
					if (key === 'set-cookie') {
						response.headers.append('set-cookie', value)
						continue
					}

					response.headers.set(key, value)
				}

				return response
			})
		}

		wobe.post(graphqlEndpoint, async (context) => {
			const response = await getResponse(context)

			for (const [key, value] of context.res.headers.entries()) {
				if (key === 'set-cookie') {
					response.headers.append('set-cookie', value)
					continue
				}

				response.headers.set(key, value)
			}

			return response
		})
	}
}
