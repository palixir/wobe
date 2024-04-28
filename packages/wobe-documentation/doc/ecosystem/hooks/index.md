# Hook

Wobe has a hook system that allows you to execute some code before or after a route handler (or both). This is useful when you want to execute some code for every request, like logging, rate limiting, bearer authentication, secured headers, CSRF protection, etc. This concept is similar to the middleware concept in other frameworks, with the difference that a middleware is only executed before the route handler, while a hook can be executed before or after the route handler.

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

An usual use case of a hook can be to check some authorizations or to validate a body request. If the validation fails, you can stop the execution of the request by throwing an HTTP error.

### Why throwing instead of just return a HTTP Response ?

In wobe we choose to throw an error because throwing an error is usually use to stop the execution of the code. In this kind of case this is what we want to do. Specially in a web framework we don't stop the code with an error message but we send a specific HTTP Response to the client. This is why we throw an `HttpException` that will be catch by the framework and send the response to the client.

### Example

In the example below we check if the user is an admin. If not, we throw an HTTP error with a status code 403. The client will receive the response that you pass into the constructor of the `HttpException`.

```ts
export const authorizationHook = (schema: TSchema): WobeHandler => {
	return async (ctx: Context) => {
		const request = ctx.request

		// Some logic to get the user that execute the request
		const user = {
			name: 'John',
			age: 25,
			type: 'NotAnAdminUser',
		}

		if (user.type !== 'Admin')
			throw new HttpException(
				new Response('You are not authorized to access to this route', {
					status: 403,
				}),
			)
	}
}
```
