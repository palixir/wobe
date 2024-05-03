<p align="center">
  <a href="https://wobe.dev"><img src="https://www.wobe.dev/logo.png" alt="Logo" height=170></a>
</p>

<h1 align="center">Wobe</h1>

<div align="center">
  <a href="https://wobe.dev">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.gg/GVuyYXNvGg">Discord</a>
</div>

## What is Wobe apollo ?

**Wobe apollo** is a plugin for the **wobe** web framework that allows you to easily use the apollo server.

## Install

```sh
bun install wobe-graphql-apollo # On bun
npm install wobe-graphql-apollo # On npm
yarn add wobe-graphql-apollo # On yarn
```

## Basic example

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

wobe.listen(3000)
```
