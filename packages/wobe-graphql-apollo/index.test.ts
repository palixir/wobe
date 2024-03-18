import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import { WobeGraphqlApolloPlugin } from '.'
import { createSchema } from 'graphql-yoga'

describe('Wobe GraphQL Yoga plugin', () => {
	it.only('should query graphql request', async () => {
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

		const res = await fetch('http://127.0.0.1:3000/graphql', {
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
		const wobe = new Wobe({ port: 3001 })

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				options: {
					graphqlEndpoint: '/graphql2',
				},
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

		const res = await fetch('http://127.0.0.1:3001/graphql2', {
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
