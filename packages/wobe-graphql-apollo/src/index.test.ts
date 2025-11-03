import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import getPort from 'get-port'
import { WobeGraphqlApolloPlugin } from '.'

describe('Wobe GraphQL Apollo plugin', () => {
	it('should have custom wobe context in graphql context with record', async () => {
		const port = await getPort()

		const wobe = new Wobe<{ customType: string }>().beforeHandler((ctx) => {
			ctx.customType = 'test'
		})

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				options: {
					typeDefs: `#graphql
					type Query {
						hello: String
					}
				  `,
					resolvers: {
						Query: {
							hello: (_, __, context) => {
								context.res.setCookie('before', 'before')

								expect(context.tata).toBeDefined()
								expect(context.res).toBeDefined()
								expect(context.request).toBeDefined()
								expect(context.customType).toEqual('test')
								return 'Hello from Apollo!'
							},
						},
					},
				},
				context: {
					tata: 'test',
				},
			}),
		)

		wobe.listen(port)

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
		expect(res.headers.get('set-cookie')).toBe('before=before;')
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it('should have custom wobe context in graphql context', async () => {
		const port = await getPort()

		const wobe = new Wobe<{ customType: string }>().beforeHandler((ctx) => {
			ctx.customType = 'test'
		})

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				options: {
					typeDefs: `#graphql
					type Query {
						hello: String
					}
				  `,
					resolvers: {
						Query: {
							hello: (_, __, context) => {
								context.res.setCookie('before', 'before')

								expect(context.tata).toBeDefined()
								expect(context.res).toBeDefined()
								expect(context.request).toBeDefined()
								expect(context.customType).toEqual('test')
								return 'Hello from Apollo!'
							},
						},
					},
				},
				context: async () => {
					return { tata: 'test' }
				},
			}),
		)

		wobe.listen(port)

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
		expect(res.headers.get('set-cookie')).toBe('before=before;')
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it('should have WobeResponse in graphql context', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				options: {
					typeDefs: `#graphql
					type Query {
						hello: String
					}
				  `,
					resolvers: {
						Query: {
							hello: (_, __, context) => {
								context.res.setCookie('before', 'before')

								expect(context.res).toBeDefined()
								expect(context.request).toBeDefined()
								return 'Hello from Apollo!'
							},
						},
					},
				},
				context: async () => {
					return { tata: 'test' }
				},
			}),
		)

		wobe.listen(port)

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
		expect(res.headers.get('set-cookie')).toBe('before=before;')
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it("should use the graphql middleware if it's provided", async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
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
				context: async () => {
					return { tata: 'test' }
				},
				graphqlMiddleware: async (resolve, res) => {
					res.setCookie('before', 'before')

					const response = await resolve()

					res.setCookie('after', 'after')

					return response
				},
			}),
		)

		wobe.listen(port)

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
		expect(res.headers.get('set-cookie')).toBe(
			'before=before;, after=after;',
		)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it('should query graphql request with context in graphql resolver', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
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
				context: async ({ request }) => {
					expect(request.method).toBe('POST')

					return { tata: 'test' }
				},
			}),
		)

		wobe.listen(port)

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

	it('should query graphql request', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
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

		wobe.listen(port)

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

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
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

		wobe.listen(port)

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
