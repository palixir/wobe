# Plugin

## Plugin philosophy

An essential aspect of Wobe is its requirement for zero dependencies. This feature offers numerous advantages such as reduced startup time, smaller final bundle size, and enhanced performance. However, the absence of external dependencies limits its ability to address all use cases. To address this, Wobe integrates a plugin system. These plugins, additional packages available for download from the npm registry, extend Wobe's functionality. The overarching vision for Wobe is that its plugin ecosystem will expand over time, accommodating a wide array of plugins to cover diverse use cases.

## How to create a plugin

A plugin is just a function that return another function that receives the `wobe` object as a parameter. This function can be used to extend the `wobe` object with new methods or properties.

```ts
import { Wobe } from 'wobe'

const myPlugin = () => {
	return (wobe: Wobe) => {
		wobe.get('/test', (context) => context.res.sendText('Hello World'))
	}
}

const wobe = new Wobe().usePlugin(myPlugin()).listen(3000)
```

## Official plugins

-   Wobe-graphql-apollo : A plugin to add an Apollo graphql server to your wobe app.

```ts
import { Wobe } from 'wobe'
import { WobeGraphqlApolloPlugin } from 'wobe-graphql-apollo'

const wobe = new Wobe().usePlugin(
	WobeGraphqlApolloPlugin({
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

-   Wobe-graphql-yoga : A plugin to add a Yoga graphql server to your wobe app.

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
