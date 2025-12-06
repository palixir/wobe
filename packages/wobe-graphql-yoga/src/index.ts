import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type Plugin,
	type YogaServerOptions,
} from 'graphql-yoga'
import { NoSchemaIntrospectionCustomRule } from 'graphql'
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
}

export const WobeGraphqlYogaPlugin = ({
	graphqlMiddleware,
	allowGetRequests = false,
	isProduction = false,
	allowIntrospection,
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
		plugins,
		graphiql: options.graphiql ?? !isProduction,
		schema:
			options.schema ||
			createSchema({
				typeDefs: options.typeDefs || '',
				resolvers: options.resolvers || {},
			}),
	})

	const handleGraphQLRequest = async (context: Context) => {
		const getResponse = async () => {
			if (!graphqlMiddleware) return yoga.handle(context.request, context)

			return graphqlMiddleware(
				async () => yoga.handle(context.request, context),
				context.res,
			)
		}

		const response = await getResponse()

		for (const [key, value] of context.res.headers.entries()) {
			if (key === 'set-cookie') {
				response.headers.append('set-cookie', value)
				continue
			}

			response.headers.set(key, value)
		}

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
