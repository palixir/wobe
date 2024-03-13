import { createSchema, createYoga } from 'graphql-yoga'
import { Wobe } from '../src'
import { ApolloServer } from '@apollo/server'
import {
	ApolloServerPluginLandingPageLocalDefault,
	ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import { startStandaloneServer } from '@apollo/server/standalone'

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
//
//
//
//
//

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
	plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
})

server.start()

const enablePlayground = true

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

wobe.get('/graphql', async (request) => {
	const res = await server.executeHTTPGraphQLRequest({
		httpGraphQLRequest: {
			method: request.method,
			body: request.body,
			headers: request.headers,
			search: getQueryString(request.url),
		},
	})

	if (res.body.kind === 'complete') {
		return new Response(res.body.string, {
			status: res.status ?? 200,
			headers: res.headers,
		})
	}

	return new Response('')
})

wobe.post('/graphql', async (request, response) => {
	const res = await server.executeHTTPGraphQLRequest({
		httpGraphQLRequest: {
			method: request.method,
			body: request.body,
			headers: request.headers,
			search: getQueryString(request.url),
		},
	})

	if (res.body.kind === 'complete') {
		return new Response(res.body.string, {
			status: res.status ?? 200,
			headers: res.headers,
		})
	}

	return new Response('')
})

wobe.start()
