import {
	ApolloServer,
	type ApolloServerOptions,
	type BaseContext,
} from '@apollo/server'
import {
	ApolloServerPluginLandingPageLocalDefault,
	ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import type { MaybePromise, Wobe, WobePlugin, WobeResponse } from 'wobe'

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

export interface GraphQLApolloPluginOptions {
	graphqlMiddleware?: (
		resolve: () => Promise<Response>,
		res: WobeResponse,
	) => Promise<Response>
}

export const WobeGraphqlApolloPlugin = async ({
	options,
	graphqlEndpoint = '/graphql',
	graphqlMiddleware,
	context,
}: {
	options: ApolloServerOptions<any>
	graphqlEndpoint?: string
	context?: (request: Request) => MaybePromise<BaseContext>
} & GraphQLApolloPluginOptions): Promise<WobePlugin> => {
	const server = new ApolloServer({
		...options,
		plugins: [
			...(options?.plugins || []),
			process.env.NODE_ENV === 'production'
				? ApolloServerPluginLandingPageProductionDefault({
						footer: false,
					})
				: ApolloServerPluginLandingPageLocalDefault({
						footer: false,
					}),
		],
	})

	await server.start()

	return (wobe: Wobe) => {
		wobe.get(graphqlEndpoint, async ({ request }) =>
			server
				.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body: await request.json(),
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
					context: context
						? () => context(request) as any
						: () => ({}),
				})
				.then((res) => {
					if (res.body.kind === 'complete') {
						return new Response(res.body.string, {
							status: res.status ?? 200,
							// @ts-expect-error
							headers: res.headers,
						})
					}

					return new Response('')
				})
				.catch((error) => {
					return new Response(error.message, {
						status: error.statusCode,
					})
				}),
		)

		wobe.post(graphqlEndpoint, async ({ request }) =>
			server
				.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method.toUpperCase(),
						body: await request.json(),
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
					context: context
						? () => context(request) as any
						: () => ({}),
				})
				.then((res) => {
					if (res.body.kind === 'complete') {
						return new Response(res.body.string, {
							status: res.status ?? 200,
							// @ts-expect-error
							headers: res.headers,
						})
					}

					return new Response('')
				})
				.catch((error) => {
					if (error instanceof Error) throw error

					return new Response(error.message, {
						status: error.statusCode,
					})
				}),
		)
	}
}
