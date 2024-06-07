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
	context?: (options: {
		request: Request
		response: WobeResponse
	}) => MaybePromise<BaseContext>
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
		const getResponse = async (
			request: Request,
			wobeResponse: WobeResponse,
		) => {
			const fetchEndpoint = async (request: Request) => {
				const res = await server.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body: await request.json(),
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
					context: async () => ({
						request: request,
						response: wobeResponse,
						...(context
							? await context({ request, response: wobeResponse })
							: {}),
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

			if (!graphqlMiddleware) return fetchEndpoint(request)

			return graphqlMiddleware(async () => {
				const response = await fetchEndpoint(request)

				return response
			}, wobeResponse)
		}

		wobe.get(graphqlEndpoint, async ({ request, res: wobeResponse }) => {
			const response = await getResponse(request, wobeResponse)

			for (const [key, value] of wobeResponse.headers.entries()) {
				if (key === 'set-cookie') {
					response.headers.append('set-cookie', value)
					continue
				}

				response.headers.set(key, value)
			}

			return response
		})

		wobe.post(graphqlEndpoint, async ({ request, res: wobeResponse }) => {
			const response = await getResponse(request, wobeResponse)

			for (const [key, value] of wobeResponse.headers.entries()) {
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
