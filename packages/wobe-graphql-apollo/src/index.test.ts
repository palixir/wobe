import { describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import getPort from 'get-port'
import { WobeGraphqlApolloPlugin } from '.'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Wobe GraphQL Apollo plugin', () => {
	it('should reject GET requests by default', async () => {
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

		const res = await fetch(
			`http://127.0.0.1:${port}/graphql?query=${encodeURIComponent(`
				query { hello }
			`)}`,
		)

		expect(res.status).toBeGreaterThanOrEqual(400)

		wobe.stop()
	})

	it('should allow GET requests when explicitly enabled', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				allowGetRequests: true,
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

		const res = await fetch(
			`http://127.0.0.1:${port}/graphql?query=${encodeURIComponent(`
				query { hello }
			`)}`,
		)

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			data: { hello: 'Hello from Apollo!' },
		})

		wobe.stop()
	})

	it('should disable introspection and landing page in production by default', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				isProduction: true,
				allowGetRequests: true,
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

		const resLanding = await fetch(`http://127.0.0.1:${port}/graphql`)
		expect(resLanding.status).toBeGreaterThanOrEqual(400)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
					query IntrospectionQuery {
						__schema { queryType { name } }
					}
				`,
			}),
		})

		const body = await res.json()

		expect(res.status).toBe(400)
		expect(body.errors?.[0]?.message?.toLowerCase()).toContain('introspection')

		wobe.stop()
	})

	it('should allow introspection when explicitly enabled in production', async () => {
		const port = await getPort()

		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				isProduction: true,
				allowIntrospection: true,
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
					query IntrospectionQuery {
						__schema { queryType { name } }
					}
				`,
			}),
		})

		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body.data?.__schema?.queryType?.name).toBeDefined()

		wobe.stop()
	})

	it('should block queries that exceed max depth', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				maxDepth: 2,
				options: {
					typeDefs: `#graphql
					type Query { hello: Hello }
					type Hello { nested: Nested }
					type Nested { value: String }
				  `,
					resolvers: {
						Query: {
							hello: () => ({ nested: { value: 'ok' } }),
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query TooDeep { hello { nested { value } } }
				`,
			}),
		})

		const body = await res.json()
		expect(body.data).toBeUndefined()
		expect(body.errors?.[0]?.message).toContain('max depth')

		wobe.stop()
	})

	it('should block queries that exceed max cost', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				maxCost: 2,
				options: {
					typeDefs: `#graphql
					type Query { a: String b: String c: String }
				  `,
					resolvers: {
						Query: {
							a: () => 'a',
							b: () => 'b',
							c: () => 'c',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query TooExpensive { a b c }
				`,
			}),
		})

		const body = await res.json()
		expect(body.data).toBeUndefined()
		expect(body.errors?.[0]?.message).toContain('too expensive')

		wobe.stop()
	})

	it('should reject multiple operations by default', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				options: {
					typeDefs: `#graphql
					type Query { a: String b: String }
				  `,
					resolvers: {
						Query: {
							a: () => 'a',
							b: () => 'b',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query One { a }
					query Two { b }
				`,
			}),
		})

		const body = await res.json()
		expect(body.data).toBeUndefined()
		expect(body.errors?.[0]?.message).toMatch(/Multiple operations|Could not determine/i)

		wobe.stop()
	})

	it('should allow only whitelisted operation names when provided', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				allowedOperationNames: ['AllowedOp'],
				allowMultipleOperations: false,
				options: {
					typeDefs: `#graphql
					type Query { a: String }
				  `,
					resolvers: {
						Query: {
							a: () => 'a',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query NotAllowed { a }
				`,
			}),
		})

		const body = await res.json()
		expect(body.data).toBeUndefined()
		expect(body.errors?.[0]?.message).toContain('not allowed')

		wobe.stop()
	})

	it('should reject requests that exceed maxRequestSizeBytes', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				maxRequestSizeBytes: 10,
				options: {
					typeDefs: `#graphql
					type Query { a: String }
				  `,
					resolvers: {
						Query: {
							a: () => 'a',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query LargePayload { a }
				`,
			}),
		})

		expect(res.status).toBe(413)
		wobe.stop()
	})

	it('should timeout when resolver exceeds timeoutMs', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				timeoutMs: 10,
				options: {
					typeDefs: `#graphql
					type Query { slow: String }
				  `,
					resolvers: {
						Query: {
							slow: async () => {
								await sleep(50)
								return 'slow'
							},
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query Slow { slow }
				`,
			}),
		})

		expect(res.status).toBe(504)
		wobe.stop()
	})

	it('should allow rateLimiter to block requests', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				rateLimiter: async () => new Response('Too Many Requests', { status: 429 }),
				options: {
					typeDefs: `#graphql
					type Query { hello: String }
				  `,
					resolvers: {
						Query: {
							hello: () => 'Hello',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query Test { hello }
				`,
			}),
		})

		expect(res.status).toBe(429)
		wobe.stop()
	})

	it('should call onRequestResolved hook with timing info', async () => {
		const port = await getPort()
		const wobe = new Wobe()
		let called = false
		let status: number | undefined

		await wobe.usePlugin(
			await WobeGraphqlApolloPlugin({
				onRequestResolved: (input) => {
					called = true
					status = input.status
				},
				options: {
					typeDefs: `#graphql
					type Query { hello: String }
				  `,
					resolvers: {
						Query: {
							hello: () => 'Hello',
						},
					},
				},
			}),
		)

		wobe.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query Hook { hello }
				`,
			}),
		})

		expect(res.status).toBe(200)
		expect(called).toBe(true)
		expect(status).toBe(200)

		wobe.stop()
	})

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
		expect(res.headers.get('set-cookie')).toBe('before=before;, after=after;')
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
