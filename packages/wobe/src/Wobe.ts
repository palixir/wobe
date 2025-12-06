import type { Server, ServerWebSocket } from 'bun'
import { RadixTree } from './router'
import { BunAdapter, NodeAdapter, type RuntimeAdapter } from './adapters'
import type { Context } from './Context'

export type MaybePromise<T> = T | Promise<T>

export interface WobeOptions {
	hostname?: string
	onError?: (error: Error) => void
	onNotFound?: (request: Request) => void
	/**
	 * Maximum accepted body size in bytes (default: 1 MiB).
	 * Used by adapters to reject overly large requests early.
	 */
	maxBodySize?: number
	/**
	 * Allowed content-encodings. If undefined, only identity/empty is allowed.
	 * Example: ['identity', 'gzip', 'deflate'].
	 */
	allowedContentEncodings?: string[]
	/**
	 * Trust proxy headers (X-Forwarded-For) for client IP detection.
	 * Default false to avoid spoofing.
	 */
	trustProxy?: boolean
	tls?: {
		key: string
		cert: string
		passphrase?: string
	}
}

export type HttpMethod = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'ALL' | 'OPTIONS'

export type WobeHandlerOutput =
	| void
	| Promise<void>
	| undefined
	| Response
	| Promise<Response>

export type WobeHandler<T> = (ctx: Context & T) => WobeHandlerOutput

export type WobePlugin = (wobe: Wobe<any>) => void

/**
 * Hook is the state of the request, it can be before the handler, after the handler or both
 */
export type Hook = 'beforeHandler' | 'afterHandler' | 'beforeAndAfterHandler'

/**
 * WobeWebSocket is the configuration for the WebSocket server
 * @param path The path of the WebSocket server
 * @param compression Enable or disable the compression of the WebSocket server
 * @param maxPayloadLength The maximum length of the payload
 * @param idleTimeout The time before the WebSocket server is closed
 * @param backpressureLimit The limit of the backpressure
 * @param closeOnBackpressureLimit Close the WebSocket server if the backpressure limit is reached
 * @param beforeWebSocketUpgrade Array of handlers before the WebSocket server is upgraded
 * @param onOpen Handler when the WebSocket server is opened
 * @param onMessage Handler when the WebSocket server receives a message
 * @param onClose Handler when the WebSocket server is closed
 * @param onDrain Handler when the WebSocket server is drained
 */
export interface WobeWebSocket {
	path: string
	compression?: boolean
	maxPayloadLength?: number
	idleTimeout?: number
	backpressureLimit?: number
	closeOnBackpressureLimit?: boolean
	beforeWebSocketUpgrade?: Array<WobeHandler<any>>
	onOpen?(ws: ServerWebSocket<any>): void
	onMessage?(ws: ServerWebSocket<any>, message: string | Buffer): void
	onClose?(
		ws: ServerWebSocket<any>,
		code: number,
		message: string | Buffer,
	): void
	onDrain?(ws: ServerWebSocket<any>): void
}

const factoryOfRuntime = (): RuntimeAdapter => {
	if (typeof Bun !== 'undefined' && !process.env.NODE_TEST)
		return BunAdapter()

	return NodeAdapter()
}

/**
 * Wobe is the main class of the framework
 */
export class Wobe<T> {
	private wobeOptions?: WobeOptions
	private server: Server<any> | null
	private hooks: Array<{
		pathname: string
		handler: WobeHandler<T>
		hook: Hook
		method: HttpMethod
	}>
	private router: RadixTree
	private runtimeAdapter: RuntimeAdapter = factoryOfRuntime()
	private httpMethods: Array<HttpMethod> = [
		'GET',
		'POST',
		'PUT',
		'DELETE',
	] as const

	private webSocket: WobeWebSocket | undefined = undefined

	/**
	 * Constructor of the Wobe class
	 * @param options The options of the Wobe class
	 */
	constructor(options?: WobeOptions) {
		this.wobeOptions = options
		this.hooks = []
		this.server = null
		this.router = new RadixTree()
	}

	/**
	 * get is the method to handle the GET requests
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	get(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) this._addHook('beforeHandler', 'GET')(path, hook)

		this.router.addRoute('GET', path, handler)

		return this
	}

	/**
	 * post is the method to handle the POST requests
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	post(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) this._addHook('beforeHandler', 'POST')(path, hook)

		this.router.addRoute('POST', path, handler)

		return this
	}

	/**
	 * put is the method to handle the PUT requests
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	put(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) this._addHook('beforeHandler', 'PUT')(path, hook)

		this.router.addRoute('PUT', path, handler)

		return this
	}

	/**
	 * delete is the method to handle the DELETE requests
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	delete(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) this._addHook('beforeHandler', 'DELETE')(path, hook)

		this.router.addRoute('DELETE', path, handler)

		return this
	}

	/**
	 * options is the method to handle the OPTIONS requests (use for pre-flight)
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	options(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) this._addHook('beforeHandler', 'OPTIONS')(path, hook)

		this.router.addRoute('OPTIONS', path, handler)

		return this
	}

	/**
	 * all is the method to handle all the requests
	 * @param path The path of the request
	 * @param handler The handler of the request
	 * @param hook The hook of the request (optional)
	 */
	all(path: string, handler: WobeHandler<T>, hook?: WobeHandler<T>) {
		if (hook) {
			this.httpMethods.map((method) =>
				this._addHook('beforeHandler', method)(path, hook),
			)
		}

		this.router.addRoute('ALL', path, handler)

		return this
	}

	private _addHook =
		(hook: Hook, method: HttpMethod) =>
		(arg1: string | WobeHandler<T>, ...handlers: WobeHandler<T>[]) => {
			let path = arg1

			if (typeof arg1 !== 'string') {
				path = '*'
				handlers.unshift(arg1)
			}

			handlers.forEach((handler) => {
				if (typeof path === 'string')
					this.hooks.push({
						pathname: path,
						handler,
						hook,
						method,
					})
			})

			return this
		}

	/**
	 * beforeAndAfterHandler is the method to handle the before and after handlers
	 * @param arg1 The path of the request or the handler
	 * @param handlers The handlers of the request
	 */
	beforeAndAfterHandler(
		arg1: string | WobeHandler<T>,
		...handlers: WobeHandler<T>[]
	) {
		this.httpMethods.map((method) =>
			this._addHook('beforeAndAfterHandler', method)(arg1, ...handlers),
		)

		return this
	}

	/**
	 * beforeHandler is the method to handle the before handlers
	 * @param arg1 The path of the request or the handler
	 * @param handlers The handlers of the request
	 */
	beforeHandler(
		arg1: string | WobeHandler<T>,
		...handlers: WobeHandler<T>[]
	) {
		this.httpMethods.map((method) =>
			this._addHook('beforeHandler', method)(arg1, ...handlers),
		)

		return this
	}

	/**
	 * afterHandler is the method to handle the after handlers
	 * @param arg1 The path of the request or the handler
	 * @param handlers The handlers of the request
	 */
	afterHandler(arg1: string | WobeHandler<T>, ...handlers: WobeHandler<T>[]) {
		this.httpMethods.map((method) =>
			this._addHook('afterHandler', method)(arg1, ...handlers),
		)

		return this
	}

	/**
	 * useWebSocket is the method to handle the WebSocket
	 * @param webSocketHandler The WebSocket handler
	 */
	useWebSocket(webSocketHandler: WobeWebSocket) {
		this.webSocket = {
			maxPayloadLength: 1024 * 1024, // 1 MiB
			idleTimeout: 60,
			backpressureLimit: 1024 * 1024,
			closeOnBackpressureLimit: true,
			...webSocketHandler,
		}

		return this
	}

	/**
	 * usePlugin is the method to use a plugin
	 * @param plugin The plugin to use
	 * You can find more informations about plugins in the documentation (https://www.wobe.dev/doc/ecosystem/plugins)
	 */
	async usePlugin(plugin: MaybePromise<WobePlugin>) {
		if (plugin instanceof Promise) {
			await plugin

			return this
		}

		plugin(this)

		return this
	}

	/**
	 * listen is the method to start the server
	 * @param port The port of the server
	 * @param callback The callback to execute after the server is started
	 */
	listen(
		port: number,
		callback?: (options: { hostname: string; port: number }) => void,
	) {
		// We need to add all hooks after the compilation
		// because the tree need to be complete
		for (const hook of this.hooks) {
			this.router.addHook(
				hook.hook,
				hook.pathname,
				hook.handler,
				hook.method,
			)
		}

		this.router.optimizeTree()

		this.server = this.runtimeAdapter.createServer(
			port,
			this.router,
			this.wobeOptions,
			this.webSocket,
		)

		callback?.({
			port,
			hostname: this.wobeOptions?.hostname || 'localhost',
		})

		return this
	}

	/**
	 * stop is the method to stop the server
	 */
	stop() {
		this.runtimeAdapter.stopServer(this.server)
	}
}
