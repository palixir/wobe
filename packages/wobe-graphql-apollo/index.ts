import { ApolloServer, type ApolloServerOptions } from '@apollo/server'
import { Wobe, type WobePlugin } from 'wobe'

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

export const WobeGraphqlApolloPlugin = ({
	options,
}: {
	options: ApolloServerOptions<any>
}) => {
	const server = new ApolloServer({
		...options,
	})

	server.start()

	return (wobe: Wobe) => {
		wobe.get('/graphql', async (request) =>
			server
				.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body: request.body,
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
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

		wobe.post('/graphql', async (request) =>
			server
				.executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: request.method,
						body: request.body,
						// @ts-expect-error
						headers: request.headers,
						search: getQueryString(request.url),
					},
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
	}
}

const wobe = new Wobe({ port: 3000 })

wobe.usePlugin(
	WobeGraphqlApolloPlugin({
		options: {
			typeDefs: `#graphql
          type Query {
            hello: String
          }
        `,
			resolvers: {
				Query: {
					hello: () => 'world',
				},
			},
		},
	}),
)

wobe.start()
