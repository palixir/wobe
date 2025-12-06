# CSRF Hook

Wobe has a `beforeHandler` hook to manage CSRF.

Behavior:

-   Enforced only on non-idempotent methods (POST/PUT/PATCH/DELETE/etc.).
-   Uses `Origin` when present; falls back to checking `Referer` host when `Origin` is missing.
-   Rejects with `403` when the origin/referer does not match the allowed list/function.

## Example

In this example all the requests without the origin equal to `http://localhost:3000` will be blocked.

```ts
import { Wobe, csrf } from 'wobe'

const app = new Wobe()
	.beforeHandler(csrf({ origin: 'http://localhost:3000' }))
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

You can also have multiple origins.

```ts
import { Wobe, csrf } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		csrf({ origin: ['http://localhost:3000', 'http://localhost:3001'] })
	)
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

Or with a function.

```ts
import { Wobe, csrf } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		csrf({ origin: (origin) => origin === 'http://localhost:3000' })
	)
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

## Options

-   `origin` (string | string[] | ((origin: string) => string | undefined | null)) : The origin(s) that are allowed to make requests.
