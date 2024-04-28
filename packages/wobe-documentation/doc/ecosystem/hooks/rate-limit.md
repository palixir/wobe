# Rate limit

Wobe has a rate limit `beforeHandler` hook that allows you to limit the number of requests on your server within a specified amount of time.

## Example

In this example the server will limit the number of request to 2 every second.

```ts
import { Wobe, rateLimit } from 'wobe'

const app = new Wobe()

app.beforeHandler(rateLimit({ numberOfRequests: 2, interval: 1000 }))
app.get('/test', (req, res) => {
	res.send('Hello World')
})
app.listen(3000)
```

## Options

-   `interval` (number) : the time in milliseconds in which the number of requests is limited.
-   `numberOfRequests` (number) : the number of requests allowed in the interval.
