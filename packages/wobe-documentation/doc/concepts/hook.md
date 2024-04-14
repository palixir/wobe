# Hook

Wobe has a hook system that allows you to execute some code before or after a route handler (or both). This is useful when you want to execute some code for every request, like logging, rate limit, bearerAuth, secured headers, csrf etc. This concept is similar to the hook concept in other frameworks at the difference a hook is only executed before the route handler while a hook can executed before or after the route handler.

## Simplest example

In this example, the logger hook will be call before each requests on the `/json` route. The message "After handler" will be displayed after each requests on any routes. The message "Before and after handler" will be displayed before and after each requests on any routes.

```ts
import { Wobe, logger } from 'wobe'

const app = new Wobe()
	.beforeHandler('/json', logger())
	.afterHandler(() => console.log('After handler'))
	.beforeAndAfterHandler(() => console.log('Before and after handler'))
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

In this example, for a request on `/hello` the output will be:

```
1 : Before and after handler
2 : GET /hello
3 : After handler
4 : Before and after handler
```
