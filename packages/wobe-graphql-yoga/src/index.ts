import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type YogaServerOptions,
	type YogaInitialContext,
} from 'graphql-yoga'
import type { MaybePromise, Wobe, WobePlugin, WobeResponse } from 'wobe'

export type GraphqlYogaContext =
	| MaybePromise<Record<string, unknown>>
	| ((initialContext: YogaInitialContext) => MaybePromise<unknown>)

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

	const handleGraphQLRequest = async (
		request: Request,
		res: WobeResponse,
	) => {
		const getResponse = async () => {
			if (!graphqlMiddleware)
				return yoga.handle(request, {
					response: res,
					request,
				})

			return graphqlMiddleware(
				async () =>
					yoga.handle(request, {
						response: res,
						request,
					}),
				res,
			)
		}

		const response = await getResponse()

		for (const [key, value] of res.headers.entries()) {
			if (key === 'set-cookie') {
				response.headers.append('set-cookie', value)
				continue
			}

			response.headers.set(key, value)
		}

		return response
	}

	return (wobe: Wobe) => {
		wobe.get(
			options?.graphqlEndpoint || '/graphql',
			async ({ request, res }) => handleGraphQLRequest(request, res),
		)
		wobe.post(
			options?.graphqlEndpoint || '/graphql',
			async ({ request, res }) => handleGraphQLRequest(request, res),
		)
	}
}
