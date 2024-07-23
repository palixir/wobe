import {
	ApolloServer,
	type ApolloServerOptions,
	type BaseContext,
} from '@apollo/server'
import {
	ApolloServerPluginLandingPageLocalDefault,
	ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import type {
	Wobe,
	MaybePromise,
	WobePlugin,
	WobeResponse,
	Context,
} from 'wobe'

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
	context: apolloContext,
}: {
	options: ApolloServerOptions<any>
	graphqlEndpoint?: string
	context?: (options: Context) => MaybePromise<BaseContext>
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

	return (wobe: Wobe<unknown>) => {
		const getResponse = async (context: Context) => {
			const fetchEndpoint = async (request: Request) => {
				const res = await server.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body:
							request.method === 'GET'
								? request.body
								: await request.json(),
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
					context: async () => ({
						...context,
						...(apolloContext ? await apolloContext(context) : {}),
					}),
				})

				if (res.body.kind === 'complete') {
					const response = new Response(res.body.string, {
						status: res.status ?? 200,
						// @ts-expect-error
						headers: res.headers,
					})

					return response
				}

				return new Response()
			}

			if (!graphqlMiddleware) return fetchEndpoint(context.request)

			return graphqlMiddleware(async () => {
				const response = await fetchEndpoint(context.request)

				return response
			}, context.res)
		}

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
