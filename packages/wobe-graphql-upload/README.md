
<p align="center">
  <a href="https://wobe.dev"><img src="https://www.wobe.dev/logo.png" alt="Logo" height=170></a>
</p>
<h1 align="center">Wobe</h1>

<div align="center">
  <a href="https://wobe.dev">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.gg/GVuyYXNvGg">Discord</a>
</div>

## What is Wobe Graphql Upload ?

**Wobe graphql upload** is a beforeHandler hook that allow to add Upload on graphql server. It uses **graphql-upload** under the hood.

## Install

```sh
bun install wobe-graphql-upload # On bun
npm install wobe-graphql-upload # On npm
yarn add wobe-graphql-upload # On yarn
```

## Basic example

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
	}),
)

wobe.listen(3000)
```
