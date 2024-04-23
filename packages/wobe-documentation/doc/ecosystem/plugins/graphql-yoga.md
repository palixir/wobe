# GraphQL Yoga

A plugin to add a Yoga GraphQL server to your wobe app.

You can simply use the plugin like this:

```ts
import { Wobe } from 'wobe'
import { WobeGraphqlYogaPlugin } from 'wobe-graphql-yoga'

const wobe = new Wobe().usePlugin(
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
```

With GraphQL Yoga plugin, you have access to all yoga options. You can refer to the [graphql-yoga documentation](https://the-guild.dev/graphql/yoga-server/docs) for more information.
