import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import { createSchema } from 'graphql-yoga'
import getPort from 'get-port'
import { WobeGraphqlYogaPlugin } from '.'

describe('Wobe GraphQL Yoga plugin', () => {
	it('should set the wobe response in the graphql context', async () => {
		const port = await getPort()
		const wobe = new Wobe<{ customType: string }>().beforeHandler((ctx) => {
			ctx.customType = 'test'
		})

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				typeDefs: `
					type Query {
						hello: String
					}
				`,
				resolvers: {
					Query: {
						hello: (_, __, context: any) => {
							context.res.setCookie('tata', 'tata')
							expect(context.test).toBeDefined()
							expect(context.res).toBeDefined()
							expect(context.request.headers).toBeDefined()
							expect(context.customType).toEqual('test')
							return 'Hello from Yoga!'
						},
					},
				},
				context: () => {
					return { test: 'test' }
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

		expect(res.headers.get('set-cookie')).toBe('tata=tata;')
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should set the wobe response in the graphql context', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				typeDefs: `
					type Query {
						hello: String
					}
				`,
				resolvers: {
					Query: {
						hello: (_, __, context: any) => {
							context.res.setCookie('tata', 'tata')
							expect(context.test).toBeDefined()
							expect(context.res).toBeDefined()
							expect(context.request.headers).toBeDefined()
							return 'Hello from Yoga!'
						},
					},
				},
				context: () => {
					return { test: 'test' }
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

		expect(res.headers.get('set-cookie')).toBe('tata=tata;')
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it("should use the graphql middleware if it's provided", async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				graphqlMiddleware: async (resolve, res) => {
					res.setCookie('before', 'before')

					const response = await resolve()

					res.setCookie('after', 'after')

					return response
				},
				typeDefs: `
            type Query {
              hello: String
            }
          `,
				resolvers: {
					Query: {
						hello: (_, __, context) => {
							expect(context.request.headers).toBeDefined()
							return 'Hello from Yoga!'
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
		expect(res.headers.get('set-cookie')).toBe(
			'before=before;, after=after;',
		)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should work with typedef and resolvers', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.usePlugin(
			WobeGraphqlYogaPlugin({
				typeDefs: `
            type Query {
              hello: String
            }
          `,
				resolvers: {
					Query: {
						hello: (_, __, context) => {
							expect(context.request.headers).toBeDefined()
							return 'Hello from Yoga!'
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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should query graphql request', async () => {
		const port = await getPort()
		const wobe = new Wobe()

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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should query graphql request with context in graphql resolver', async () => {
		const port = await getPort()
		const wobe = new Wobe()

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
							hello: (_, __, context) => {
								expect(context.request.method).toBe('POST')
								expect(context.tata).toBe('test')

								return 'Hello from Yoga!'
							},
						},
					},
				}),
				context: ({ request, params }) => {
					expect(request.method).toBe('POST')
					expect(request.headers).toBeDefined()
					expect(params).toBeDefined()

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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})

	it('should query graphql request on different graphql endpoint', async () => {
		const port = await getPort()
		const wobe = new Wobe()

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
			data: { hello: 'Hello from Yoga!' },
		})

		wobe.stop()
	})
})
