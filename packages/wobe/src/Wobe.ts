import type { Server } from 'bun'
import { RadixTree } from './router'
import { Context } from './Context'
import { BunAdapter, NodeAdapter, type RuntimeAdapter } from './adapters'

export type MaybePromise<T> = T | Promise<T>

export type Routes = Array<{
	path: string
	handler: WobeHandler
	method: HttpMethod
}>

export interface WobeOptions {
	hostname?: string
	onError?: (error: Error) => void
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

const factoryOfRuntime = (): RuntimeAdapter => {
	if (typeof Bun !== 'undefined' && !process.env.NODE_TEST)
		return BunAdapter()

	return NodeAdapter()
}

// TODO : Create assert before middleware if it's specific to a type of hook (before, after, beforeAndAfter)
export class Wobe {
	private options?: WobeOptions
	private server: Server | null
	private middlewares: Array<{
		pathname: string
		handler: WobeHandler
		hook: Hook
	}>
	private router: RadixTree
	private runtimeAdapter: RuntimeAdapter = factoryOfRuntime()

	constructor(options?: WobeOptions) {
		this.options = options
		this.middlewares = []
		this.server = null
		this.router = new RadixTree()
	}

	get(path: string, handler: WobeHandler) {
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

	private _addMiddleware =
		(hook: Hook) =>
		(arg1: string | WobeHandler, ...handlers: WobeHandler[]) => {
			let path = arg1

			if (typeof arg1 !== 'string') {
				path = '*'
				handlers.unshift(arg1)
			}

			handlers.map((handler) => {
				if (typeof path === 'string')
					this.middlewares.push({ pathname: path, handler, hook })
			})

			return this
		}

	beforeAndAfterHandler(
		arg1: string | WobeHandler,
		...handlers: WobeHandler[]
	) {
		return this._addMiddleware('beforeAndAfterHandler')(arg1, ...handlers)
	}

	beforeHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		return this._addMiddleware('beforeHandler')(arg1, ...handlers)
	}

	afterHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		return this._addMiddleware('afterHandler')(arg1, ...handlers)
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

		// We need to add all middlewares after the compilation
		// because the tree need to be complete
		for (const middleware of this.middlewares) {
			this.router.addMiddleware(
				middleware.hook,
				middleware.pathname,
				middleware.handler,
			)
		}

		this.server = this.runtimeAdapter.createServer(
			port,
			this.router,
			this.options,
		)
	}

	stop() {
		this.runtimeAdapter.stopServer(this.server)
	}
}
