import { createSchema, createYoga } from 'graphql-yoga'
import { Wobe } from '../src'

const wobe = new Wobe({
	port: 3000,
})

wobe.get('/test', (req, res) => {
	res.send('Hi')
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

wobe.get('/graphql', async (request, response) => {
	const res = await yoga.fetch(request)
	response.setResponse(res)

	return res
})

wobe.post('/graphql', async (request, response) => {
	const res = await yoga.fetch(request)
	response.setResponse(res)

	return res
})

wobe.start()
