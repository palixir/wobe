# Wobe context

## Context object

Each Wobe route handler receives a context object that contains some information about the request like the params, the ipAdress, the headers, the body, etc. It also contains the response object that you can use to send the response to the client.

Here is the list of the properties of the context object:

-   `req`: The request object from the client.
-   `res`: The response object that you can use to send the response to the client.
-   `params`: The parameters of the route.
-   `query`: The query parameters of the route (all parameters after the ? in the url).
-   `ipAddress`: A function that returns the ip address of the client.
-   `headers`: The headers of the request.
-   `body`: The body of the request.
-   `state`: The state of your position in the life cycle (beforeHandler, handler or afterHandler).
-   `requestStartTimeInMs`: If you use the `logger` hook, this property will be set to the time in milliseconds when the request has been received. It's allow you to calculate the time spent in the handler.

## The response object

The response object is used to send the response to the client. It has the following methods:

-   `sendText`: Send a text response.
-   `sendJson`: Send a JSON response.
-   `send`: Send a response. You can send a text, a JSON object.
-   `setCookie`: Set a cookie in the response.
-   `getCookie`: Get a cookie from the request.
-   `deleteCookie`: Delete a cookie from the response.

You can also directly access to some properties of the response object:

-   `status`: Set the status code of the response.
-   `statusText`: Set the status text of the response.
-   `header`: Set a header of the response.

## Examples

Here is an example of a route handler that sends a text response:

```ts
import { Wobe } from 'wobe'

const app = new Wobe()
	.get('/hello', (context) => context.res.sendText('Hello world'))
	.listen(3000)
```

Here is an example of a route handler that set a cookie, change the status of the response and send a JSON response:

```ts
import { Wobe } from 'wobe'

const app = new Wobe()
	.get('/hello', (context) => {
		context.res.setCookie('myCookie', 'myValue', { httpOnly: true })
		context.res.status = 201
		context.res.sendJson({ message: 'Hello world' })
	})
	.listen(3000)
```
