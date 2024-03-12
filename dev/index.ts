import { createSchema, createYoga } from 'graphql-yoga'
import { Wobe } from '../src'
import { ApolloServer } from '@apollo/server'

const wobe = new Wobe({
	port: 3000,
})

wobe.get('/test', (req, res) => {
	return res.send('Hi')
})

const yoga = createYoga({
	cors: false,
	schema: createSchema({
		typeDefs: /* GraphQL */ `
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
})

// wobe.get('/graphql', async (request, response) => yoga.fetch(request))
// wobe.post('/graphql', async (request, response) => yoga.fetch(request))

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`

// A map of functions which return data for the schema.
const resolvers = {
	Query: {
		hello: () => 'world',
	},
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
})

server.start()

wobe.get('/graphql', async (request, response) => {
	server
		.executeHTTPGraphQLRequest({
			httpGraphQLRequest: {
				method: request.method,
				body: request.body,
				headers: request.headers,
			},
		})
		.then((result) => {
			response.send(result)
		})
})
wobe.post('/graphql', async (request, response) => {
	server
		.executeHTTPGraphQLRequest({
			httpGraphQLRequest: {
				method: request.method,
				body: request.body,
				headers: request.headers,
			},
		})
		.then((result) => {
			if (result.body.kind === 'complete')
				return new Response(result.body.string, {
					status: result.status ?? 200,
					// @ts-ignore
					headers: res.headers,
				})

			return new Response('')
		})
})

wobe.start()
