# Cors hook

Wobe has a `beforeHandker` hook to manage CORS.

## Example

You can only authorize some requests with the `origin` option

First of all you will need to enable prelight requests for cors like this :

```ts
const app = new Wobe().options(
	'*',
	(ctx) => ctx.res.send(null),
	cors({
		origin: 'http://localhost:3000',
		allowHeaders: ['content-type'],
		credentials: true,
	}),
)
```

than: 

```ts
import { Wobe, cors } from 'wobe'

const app = new Wobe()
	.beforeHandler(cors({ origin: 'http://localhost:3000' }))
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

With multiple origins.

```ts
import { Wobe, cors } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }),
	)
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

Or with a function.

```ts
import { Wobe, cors } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		cors({ origin: (origin) => origin === 'http://localhost:3000' }),
	)
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

## Options

-   `origin` (string | string[] | ((origin: string) => string | undefined | null)) : The origin(s) that are allowed to make requests.
-   `allowMethods` (string[]): The HTTP methods that are allowed to make requests.
-   `allowHeaders` (string[]): The HTTP headers that are allowed to make requests.
-   `maxAge` (number): The maximum amount of time that a preflight request can be cached.
-   `credentials` (boolean): Indicates whether or not the response to the request can be exposed when the credentials flag is true.
-   `exposeHeaders` (string[]): The headers that are allowed to be exposed to the web page.
