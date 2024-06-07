# GraphQL Yoga

A plugin to add a Yoga GraphQL server to your wobe app.

You can simply use the plugin like this:

```ts
import { Wobe } from 'wobe'
import { WobeGraphqlYogaPlugin } from 'wobe-graphql-yoga'

const wobe = new Wobe().usePlugin(
	WobeGraphqlYogaPlugin({
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
		maskedErrors: false, // You can mask the errors to have generic errors in production
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

wobe.listen(3000)
```

With GraphQL Yoga plugin, you have access to all yoga options. You can refer to the [graphql-yoga documentation](https://the-guild.dev/graphql/yoga-server/docs) for more informations.
