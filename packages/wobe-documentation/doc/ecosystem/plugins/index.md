# Plugins

An essential aspect of Wobe is its requirement for zero dependencies. This feature offers numerous advantages such as reduced startup time, smaller final bundle size, and enhanced performance. However, the absence of external dependencies limits its ability to address all use cases. To address this, Wobe integrates a plugin system. These plugins, additional packages available for download from the npm registry, extend Wobe's functionality. The overarching vision for Wobe is that its plugin ecosystem will expand over time, accommodating a wide array of plugins to cover diverse use cases.

## How to create and use a plugin

A plugin is essentially a function that returns another function, which in turn accepts the Wobe object as a parameter. This inner function serves to expand the capabilities of the Wobe object by adding new methods or properties.

```ts
import { Wobe } from 'wobe'

const myPlugin = () => {
	return (wobe: Wobe) => {
		wobe.get('/test', (context) => context.res.sendText('Hello World'))
	}
}

const wobe = new Wobe().usePlugin(myPlugin()).listen(3000)
```

To utilize a plugin that returns a promise, you can directly `await` it within the `usePlugin` method. Such a plugin is handy in scenarios like initiating a server, such as with the graphql-apollo plugin.

```ts
import { Wobe } from 'wobe'

const myAsyncPlugin = async () => {
	return (wobe: Wobe) => {
		wobe.get('/test', (context) => context.res.sendText('Hello World'))
	}
}

const wobe = new Wobe().usePlugin(await myAsyncPlugin()).listen(3000)
```
