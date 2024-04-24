# Logger

Wobe has a logger `beforeAndAfterHandler` that allow to log something before and after a function is called. For example, it can be useful to log the time taken by an handler to execute.

## Example

By default the logger middleware will use `console.log`to log the message.

```ts
import { Wobe, logger } from 'wobe'

const app = new Wobe()

app.beforeAndAfterHandler(logger())
app.get('/test', (req, res) => {
	res.send('Hello World')
})
app.listen(3000)
```

You can also pass a custom function (see [Options sections](#options)) to the logger middleware.

```ts
import { Wobe, logger } from 'wobe'

const app = new Wobe()

app.beforeAndAfterHandler(
	logger({loggerFunction : ({	beforeHandler, method, url, status, requestStartTimeInMs}) => {
	   // Some log logic ...
	})
)
app.get('/test', (req, res) => {
  res.send('Hello World')
})
app.listen(3000)
```

## Options

-   `loggerFunction` (function) : the function that will be called to log the message.

**Parameters of the function :**

-   `beforeHandler` (boolean) : true if the function is called before the handler, false otherwise.
-   `method` (string) : the HTTP method of the request.
-   `url` (string) : the URL of the request.
-   `status` (number <Badge type="warning" text="optional" />) : the status code of the response (only in afterHandler).
-   `requestStartTimeInMs` (number <Badge type="warning" text="optional" />) : the time in milliseconds when the request was received (only in afterHandler).
