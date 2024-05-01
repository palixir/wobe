<p align="center">
  <a href="https://wobe.dev"><img src="/packages/wobe-documentation/assets/logo.png" alt="Logo" height=170></a>
</p>
<h1 align="center">Wobe</h1>

<div align="center">
  <a href="">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="">Discord</a>
</div>

### [Read the docs](https://wobe.dev)

# What is wobe validator ?

Wobe has a validator `beforeHandler` hook that allows you to validate the request body. It can be considered as an equivalent of `express-validator` for Express.

Because validator's hook uses `typebox` in background, it is in a separate package to avoid unnecessary dependencies on the main package if you don't want to use this hook.

## Install

```sh
bun install wobe-validator # On bun
npm install wobe-validator # On npm
yarn add wobe-validator # On yarn
```

## Basic example

In this example, we will check if the body of the request is an object with a `name` field that is a string. If the validation fails, the request will be rejected with a `400` status code.

```ts
import { Wobe } from 'wobe'
import { wobeValidator } from 'wobe-validator'
import { Type as T } from '@sinclair/typebox'

const wobe = new Wobe()

const schema = T.Object({
	name: T.String(),
})

wobe.post(
	'/test',
	(ctx) => {
		return ctx.res.send('ok')
	},
	wobeValidator(schema),
)

wobe.listen(3000)
```

In the above example the following request will be accepted:

```ts
// Success
await fetch(`http://127.0.0.1:3000/test`, {
	method: 'POST',
	body: JSON.stringify({ name: 'testName' }),
	headers: {
		'Content-Type': 'application/json',
	},
})
```

The following request will be rejected:

```ts
// Failed
await fetch(`http://127.0.0.1:3000/test`, {
	method: 'POST',
	body: JSON.stringify({ name: 42 }),
	headers: {
		'Content-Type': 'application/json',
	},
})
```

## Options

The `wobeValidator` function accepts a schema in input that is the `typebox` schema. See [here](https://github.com/sinclairzx81/typebox) for more informations.
