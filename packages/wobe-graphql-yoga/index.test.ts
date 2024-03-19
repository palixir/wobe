import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import { createSchema } from 'graphql-yoga'
import getPort from 'get-port'
import { WobeGraphqlYogaPlugin } from '.'

describe('Wobe GraphQL Yoga plugin', () => {
	it('should query graphql request', async () => {
		const port = await getPort()
		const wobe = new Wobe({ port })

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				schema: createSchema({
					typeDefs: `
					type Query {
						hello: String
					}
				`,
					resolvers: {
						Query: {
							hello: () => 'Hello from Yoga!',
						},
					},
				}),
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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should query graphql request on different graphql endpoint', async () => {
		const port = await getPort()
		const wobe = new Wobe({ port })

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				graphqlEndpoint: '/graphql2',
				schema: createSchema({
					typeDefs: `
				type Query {
      hello: String
    }
      `,
					resolvers: {
						Query: {
							hello: () => 'Hello from Yoga!',
						},
					},
				}),
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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})
})
