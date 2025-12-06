# Body limit

Wobe has a `beforeHandler` hook to put a limit to the body size of each requests.

Note: Wobe also enforces a global body size limit (default 1 MiB) at the adapter level via the `maxBodySize` option on `new Wobe({ ... })`. Use the hook if you need a tighter or route-specific limit.

## Example

```ts
import { Wobe, bodyLimit } from 'wobe'

const app = new Wobe()

// 1000 bytes
app.beforeHandler(bodyLimit(1000))
app.post('/test', (req, res) => {
	res.send('Hello World')
})
app.listen(3000)
```

In this example, the body limit is set to 1000 bytes. If the body size is bigger than 1000 bytes, the server will respond with a `413 Payload Too Large` status code.

## Options

-   `maxSize` (number) : The maximum size of the body in bytes.
