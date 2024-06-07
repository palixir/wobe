# GraphQL Apollo Server

A plugin to add a GraohQL Apollo server to your wobe app.

You can simply use the plugin like this:

```ts
import { Wobe } from 'wobe'
import { WobeGraphqlApolloPlugin } from 'wobe-graphql-apollo'

const wobe = new Wobe().usePlugin(
	await WobeGraphqlApolloPlugin({
		options: {
			typeDefs: `
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
		graphqlMiddleware: async (resolve, res) => {
			// Execute some code before graphql resolver

			const response = await resolve()

			// Execute some code after graphql resolver

			return response
		},
		context: ({ request, response }) => {
			const accessToken = request.headers.get('Access-Token')

			response.setCookie('cookieName', 'cookieValue')

			return { accessToken }
		},
	}),
)

wobe.listen(port)
```

With GraphQL Apollo Server plugin, you have access to all apollo server options. You can refer to the [graphql-apollo-server documentation](https://www.apollographql.com/docs/apollo-server/) for more informations.
