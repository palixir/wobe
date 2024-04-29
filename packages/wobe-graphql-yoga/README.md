<p align="center">
  <a href="https://wobe.dev"><img src="/packages/wobe-documentation/assets/logo.png" alt="Logo" height=170></a>
</p>
<h1 align="center">Wobe</h1>

<div align="center">
  <a href="">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="">Discord</a>
</div>

### [Read the docs]()

## What is Wobe apollo ?

**Wobe yoga** is a plugin for the **wobe** web framework that allows you to easily use the yoga graphql server.

## Install

```sh
bun install wobe-graphql-yoga # On bun
npm install wobe-graphql-yoga # On npm
yarn add wobe-graphql-yoga # On yarn
```

## Basic example

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

wobe.listen(3000)
```
