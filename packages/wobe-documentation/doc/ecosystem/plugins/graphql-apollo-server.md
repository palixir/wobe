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
	}),
)

wobe.listen(port)
```

With GraphQL Apollo Server plugin, you have access to all apollo server options. You can refer to the [graphql-apollo-server documentation](https://www.apollographql.com/docs/apollo-server/) for more informations.
