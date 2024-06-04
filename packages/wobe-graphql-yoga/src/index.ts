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
	const yoga = createYoga({
		...options,
		schema:
			options.schema ||
			createSchema({
				typeDefs: options.typeDefs || '',
				resolvers: options.resolvers || {},
			}),
	})

	return (wobe: Wobe) => {
		wobe.get(
			options?.graphqlEndpoint || '/graphql',
			async ({ request, res }) => {
				if (!graphqlMiddleware) return fetch(request)

				return graphqlMiddleware(async () => {
					const response = await fetch(request)

					return res.copy(response).response || new Response()
				}, res)
			},
		)
		wobe.post(
			options?.graphqlEndpoint || '/graphql',
			async ({ request, res }) => {
				if (!graphqlMiddleware) return fetch(request)

				return graphqlMiddleware(async () => {
					const response = await yoga.fetch(request)

					console.log(res.copy(response))

					return res.copy(response).response || new Response()
				}, res)
			},
		)
	}
}
