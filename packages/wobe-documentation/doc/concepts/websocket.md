# WebSocket

WebSocket is a real-time protocol to communicate between a client and a server.

Wobe proposes a simple way to create a WebSocket server.

Note: Wobe WebSocket is only available on Bun for the moment.

## Create a simple WebSocket server

You can easily add a WebSocket endpoint to your Wobe server by using the `useWebSocket` function.

```ts
import { Wobe } from 'wobe'

const wobe = new Wobe()

wobe.useWebSocket({
	path: '/ws',
	onOpen(ws) {
		ws.send('Hello new connection')
	},
	onMessage: (ws, message) => {
		ws.send(`You said: ${message}`)
	},
	onClose(ws) {
		ws.send('Goodbye')
	},
})

wobe.listen(3000)
```

In this example, we create a WebSocket server on the /ws path. When a client connects on this path, we send a message to the client. When the client sends a message, we send back the message. When the client disconnects, we send a goodbye message.

## WebSocket options

The `useWebSocket` function takes an object with the following properties:

-   `path`: The path of the WebSocket endpoint.
-   `onOpen`: A function called when a new client connects. It takes the WebSocket object as argument.
-   `onMessage`: A function called when a client sends a message. It takes the WebSocket object and the message as arguments.
-   `onClose`: A function called when a client disconnects. It takes the WebSocket object, the close code and the close message as arguments.
-   `compression`: A boolean to enable or disable the compression. Default is
    `false`.
-   `backpressureLimit`: The maximum number of bytes that can be buffered before the server stops reading from the socket. Default is `1024 * 1024 = 1MB`.
-   `idleTimeout`: The maximum number of seconds that a connection can be idle before being closed. Default is `120 seconds`.
-   `closeOnBackpressureLimit`: A boolean to close the connection when the backpressure limit is reached. Default is `false`.
-   `maxPayloadLength`: The maximum length of the payload that the server will accept. Default is `16 * 1024 * 1024 = 16MB`.
-   `beforeWebSocketUpgrade`: An array of hook (same type as a Wobe hook) to execute before the WebSocket upgrade. Default is `[]`.
