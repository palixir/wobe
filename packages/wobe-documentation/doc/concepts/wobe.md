# Wobe

To create a web server you will need to instantiate a `Wobe` object.

```ts
import { Wobe } from 'wobe'

const wobe = new Wobe()

wobe.listen(3000)
```

## Options

The `Wobe` constructor can have some options:

-   `hostname`: The hostname where the server will be listening.
-   `onError`: A function that will be called when an error occurs.
-   `onNotFound`: A function that will be called when a route is not found.
-   `tls`: An object with the key, the cert and the passphrase if exist to enable HTTPS.

```ts
import { Wobe } from 'wobe'

const wobe = new Wobe({
	hostname: 'hostname',
	onError: (error) => console.error(error),
	onNotFound: (request) => console.error(`${request.url} not found`),
	tls: {
		key: 'keyContent',
		cert: 'certContent',
		passphrase: 'Your passphrase if exists',
	},
})

wobe.listen(3000, ({ hostname, port }) => {
	console.log(`Server running at https://${hostname}:${port}`)
})
```
