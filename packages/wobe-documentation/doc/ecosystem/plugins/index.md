# Plugins

An essential aspect of Wobe is its requirement for zero dependencies. This feature offers numerous advantages such as reduced startup time, smaller final bundle size, and enhanced performance. However, the absence of external dependencies limits its ability to address all use cases. To address this, Wobe integrates a plugin system. These plugins, additional packages available for download from the npm registry, extend Wobe's functionality. The overarching vision for Wobe is that its plugin ecosystem will expand over time, accommodating a wide array of plugins to cover diverse use cases.

## How to create and use a plugin

A plugin is just a function that return another function that receives the `Wobe` object as a parameter. This function can be used to extend the `Wobe` object with new methods or properties.

```ts
import { Wobe } from 'wobe'

const myPlugin = () => {
	return (wobe: Wobe) => {
		wobe.get('/test', (context) => context.res.sendText('Hello World'))
	}
}

const wobe = new Wobe().usePlugin(myPlugin()).listen(3000)
```

For a plugin that returns a promise you can `await` it directly in the usePlugin method. You can have this kind of plugin when for example you need to start a server (like the graphql-apollo plugin for example).

```ts
import { Wobe } from 'wobe'

const myAsyncPlugin = async () => {
	return (wobe: Wobe) => {
		wobe.get('/test', (context) => context.res.sendText('Hello World'))
	}
}

const wobe = new Wobe().usePlugin(await myAsyncPlugin()).listen(3000)
```
