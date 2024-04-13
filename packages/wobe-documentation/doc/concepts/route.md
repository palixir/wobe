# Routes

Wobe route system follows the standards so on this is very simple to use.

## Simplest example

```ts
import { Wobe } from 'wobe'

const app = new Wobe()
	// GET HTTP method
	.get('/hello', (context) => context.res.sendText('Hello GET world'))
	// POST HTTP method
	.post('/post/hello', (context) => context.res.sendText('Hello POST world'))
	// PUT HTTP method
	.put('/put/hello', (context) => context.res.sendText('Hello PUT world'))
	// DELETE HTTP method
	.delete('/delete/hello', (context) =>
		context.res.sendText('Hello DELETE world'),
	)
	.listen(3000)
```

## Send response

-   You can send a text response using the `sendText` function.

```ts
import { Wobe } from 'wobe'

const app = new Wobe()
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

-   If you want to send a JSON response you can use the `sendJson` function.

```ts
import { Wobe } from 'wobe'

const app = new Wobe()
	.get('/hello', (context) =>
		context.res.sendJson({ message: 'Hello world' }),
	)
	.listen(3000)
```

-   If you don't know at the advance what type is your response you can simply use the `send` function.

```ts
const app = new Wobe()
	.get('/hello', (context) => context.res.send('Hello world'))
	.get('/hello2', (context) => context.res.send({ message: 'Hello world' }))
	.listen(3000)
```

## Route with parameters

You could also have some routes with parameters that can be easily accessible through the `context.params` object.

```ts
const app = new Wobe()
	.get('/hello/:name', (context) =>
		context.sendText(`Hello ${context.params.name}`),
	)
	.listen(3000)
```
