import type { Server, ServerWebSocket } from 'bun'
import { RadixTree } from './router'
import { BunAdapter, NodeAdapter, type RuntimeAdapter } from './adapters'
import type { Context } from './Context'

export type MaybePromise<T> = T | Promise<T>

export type Routes = Array<{
	path: string
	handler: WobeHandler
	method: HttpMethod
}>

export interface WobeOptions {
	hostname?: string
	onError?: (error: Error) => void
	onNotFound?: (request: Request) => void
}

export type HttpMethod = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'ALL'

export type WobeHandlerOutput =
	| void
	| Promise<void>
	| undefined
	| Response
	| Promise<Response>

export type WobeHandler = (ctx: Context) => WobeHandlerOutput

export type WobePlugin = (wobe: Wobe) => void

export type Hook = 'beforeHandler' | 'afterHandler' | 'beforeAndAfterHandler'

export interface WobeWebSocket {
	path: string
	compression?: boolean
	maxPayloadLength?: number
	idleTimeout?: number
	backpressureLimit?: number
	closeOnBackpressureLimit?: boolean
	beforeWebSocketUpgrade?: Array<WobeHandler>
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

// TODO : Create assert before hook if it's specific to a type of hook (before, after, beforeAndAfter)
export class Wobe {
	private options?: WobeOptions
	private server: Server | null
	private hooks: Array<{
		pathname: string
		handler: WobeHandler
		hook: Hook
	}>
	private router: RadixTree
	private runtimeAdapter: RuntimeAdapter = factoryOfRuntime()

	private webSocket: WobeWebSocket | undefined = undefined

	constructor(options?: WobeOptions) {
		this.options = options
		this.hooks = []
		this.server = null
		this.router = new RadixTree()
	}

	get(path: string, handler: WobeHandler, hook?: WobeHandler) {
		this.router.addRoute('GET', path, handler)

		return this
	}

	post(path: string, handler: WobeHandler) {
		this.router.addRoute('POST', path, handler)

		return this
	}

	put(path: string, handler: WobeHandler) {
		this.router.addRoute('PUT', path, handler)

		return this
	}

	delete(path: string, handler: WobeHandler) {
		this.router.addRoute('DELETE', path, handler)

		return this
	}

	all(path: string, handler: WobeHandler) {
		this.router.addRoute('ALL', path, handler)

		return this
	}

	private _addHook =
		(hook: Hook) =>
		(arg1: string | WobeHandler, ...handlers: WobeHandler[]) => {
			let path = arg1

			if (typeof arg1 !== 'string') {
				path = '*'
				handlers.unshift(arg1)
			}

			handlers.map((handler) => {
				if (typeof path === 'string')
					this.hooks.push({ pathname: path, handler, hook })
			})

			return this
		}

	beforeAndAfterHandler(
		arg1: string | WobeHandler,
		...handlers: WobeHandler[]
	) {
		return this._addHook('beforeAndAfterHandler')(arg1, ...handlers)
	}

	beforeHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		return this._addHook('beforeHandler')(arg1, ...handlers)
	}

	afterHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		return this._addHook('afterHandler')(arg1, ...handlers)
	}

	useWebSocket(webSocketHandler: WobeWebSocket) {
		this.webSocket = webSocketHandler

		return this
	}

	usePlugin(plugin: MaybePromise<WobePlugin>) {
		if (plugin instanceof Promise) {
			plugin.then((p) => {
				return p(this)
			})

			return this
		}

		plugin(this)

		return this
	}

	listen(port: number) {
		this.router.optimizeTree()

		// We need to add all hooks after the compilation
		// because the tree need to be complete
		for (const hook of this.hooks) {
			this.router.addHook(hook.hook, hook.pathname, hook.handler)
		}

		this.server = this.runtimeAdapter.createServer(
			port,
			this.router,
			this.options,
			this.webSocket,
		)

		return this
	}

	stop() {
		this.runtimeAdapter.stopServer(this.server)
	}
}
