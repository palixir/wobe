import type { Server } from 'bun'
import { RadixTree } from './router'
import { extractPathnameAndSearchParams } from './utils'
import { HttpException } from './HttpException'
import { Context } from './Context'

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

	constructor(options?: WobeOptions) {
		this.options = options
		this.hooks = []
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

		const router = this.router
		const options = this.options

		// Benchmark:
		// Full = 44 000 ns
		// Empty = 32 500 ns
		this.server = Bun.serve({
			port,
			hostname: this.options?.hostname,
			development: false,
			async fetch(req) {
				const { pathName, searchParams } =
					extractPathnameAndSearchParams(req)

				const route = router.findRoute(
					req.method as HttpMethod,
					pathName,
				)

				if (!route) return new Response(null, { status: 404 })

				const context = new Context(req)

				context.getIpAdress = () => this.requestIP(req)?.address || ''
				context.state = 'beforeHandler'
				context.params = route.params || {}
				context.query = searchParams || {}

				try {
					const hookBeforeHandler = route.beforeHandlerHook || []

					// We need to run hook sequentially
					for (let i = 0; i < hookBeforeHandler.length; i++) {
						const hook = hookBeforeHandler[i]

						await hook(context)
					}

					context.state = 'handler'

					const resultHandler = await route.handler?.(context)

					if (
						!context.res.response &&
						resultHandler instanceof Response
					)
						context.res.response = resultHandler

					context.state = 'afterHandler'

					const hookAfterHandler = route.afterHandlerHook || []

					// We need to run hook sequentially
					let responseAfterHook = undefined
					for (let i = 0; i < hookAfterHandler.length; i++) {
						const hook = hookAfterHandler[i]

						responseAfterHook = await hook(context)
					}

					if (responseAfterHook instanceof Response)
						return responseAfterHook

					return (
						context.res.response ||
						new Response(null, { status: 404 })
					)
				} catch (err: any) {
					if (err instanceof Error) options?.onError?.(err)

					if (err instanceof HttpException) return err.response

					return new Response(err.message, {
						status: Number(err.code) || 500,
					})
				}
			},
		})
	}

	stop() {
		this.server?.stop()
	}
}
