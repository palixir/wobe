# Bearer auth

Wobe has a `beforeHandler` hook to manage simple Bearer authentication.

## Example

A simple example without hash function.

```ts
import { Wobe, bearerAuth } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		bearerAuth({
			token: 'token',
		}),
	)
	.get('/protected', (req, res) => {
		res.send('Protected')
	})
	.listen(3000)

// A request like this will be accepted
const request = new Request('http://localhost:3000/test', {
	headers: {
		Authorization: 'Bearer 123',
	},
})
```

You can also add an hash function to compare the token with a hashed version.

```ts
import { Wobe, bearerAuth } from 'wobe'

const app = new Wobe()
	.beforeHandler(
		bearerAuth({
			token: 'token',
			hashFunction: (token) => token,
		}),
	)
	.get('/protected', (req, res) => {
		res.send('Protected')
	})
	.listen(3000)

// A request like this will be accepted
const request = new Request('http://localhost:3000/test', {
	headers: {
		Authorization: 'Bearer SomeHashedToken',
	},
})
```

## Options

-   `token` (string) : The token to compare with the Authorization header.
-   `realm` (string) : The realm to send in the WWW-Authenticate header.
-   `hashFunction` ((token: string) => string) : A function to hash the token before comparing it.
