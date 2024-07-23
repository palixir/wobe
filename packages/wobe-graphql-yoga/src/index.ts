import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type YogaServerOptions,
} from 'graphql-yoga'
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
}

export const WobeGraphqlYogaPlugin = ({
	graphqlMiddleware,
	...options
}: {
	schema?: GraphQLSchemaWithContext<Record<string, any>>
	typeDefs?: string
	context?: GraphqlYogaContext
	resolvers?: Record<string, any>
} & Omit<YogaServerOptions<any, any>, 'context'> &
	GraphqlYogaPluginOptions): WobePlugin => {
	const yoga = createYoga<{
		request: Request
		response: WobeResponse
	}>({
		...options,
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
		wobe.get(options?.graphqlEndpoint || '/graphql', async (context) =>
			handleGraphQLRequest(context),
		)
		wobe.post(options?.graphqlEndpoint || '/graphql', async (context) =>
			handleGraphQLRequest(context),
		)
	}
}
