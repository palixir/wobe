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

## Stop the execution of the request in a beforeHandler hook

An usual use case of a hook can be to check the some authorization or to validate a body request. If the validation fails, you can stop the execution of the request by throwing an HTTP error.

In the example below we check if the content-type is `application/json` and if the body of the request is valid according to a schema. If the validation fails, we throw an `HttpException` error with a status code of 400. When you specicaly use the `HttpException` error (exported in Wobe) the response of your request will be the response that you set in the first parameter of the `HttpException` constructor.

```ts
export const wobeValidator = (schema: TSchema): WobeHandler => {
	return async (ctx: Context) => {
		const request = ctx.request

		if (request.headers.get('content-type') !== 'application/json') return

		const body = await request.json()

		if (!Value.Check(schema, body))
			throw new HttpException(
				new Response(
					JSON.stringify({
						errors: [...Value.Errors(schema, body)],
					}),
					{ status: 400 },
				),
			)
	}
}
```
