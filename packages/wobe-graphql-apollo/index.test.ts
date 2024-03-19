import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import getPort from 'get-port'
import { WobeGraphqlApolloPlugin } from '.'

describe('Wobe GraphQL Apollo plugin', () => {
	it('should query graphql request', async () => {
		const port = await getPort()

		const wobe = new Wobe({ port })

		await wobe.usePlugin(
			WobeGraphqlApolloPlugin({
				options: {
					typeDefs: `#graphql
            type Query {
              hello: String
            }
          `,
					resolvers: {
						Query: {
							hello: () => 'Hello from Apollo!',
						},
					},
				},
			}),
		)

		wobe.start()

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
				  query {
            hello
					}
				`,
			}),
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it('should query graphql request on a custom graphql endpoint', async () => {
		const port = await getPort()

		const wobe = new Wobe({ port })

		await wobe.usePlugin(
			WobeGraphqlApolloPlugin({
				graphqlEndpoint: '/graphql2',
				options: {
					typeDefs: `#graphql
            type Query {
              hello: String
            }
          `,
					resolvers: {
						Query: {
							hello: () => 'Hello from Apollo!',
						},
					},
				},
			}),
		)

		wobe.start()

		const res = await fetch(`http://127.0.0.1:${port}/graphql2`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
				  query {
            hello
					}
				`,
			}),
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})
})
