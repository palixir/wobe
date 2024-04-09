import type { Server } from 'bun'
import { WobeResponse } from './WobeResponse'
import { RadixTree } from './router'
import { extractPathnameAndSearchParams } from './utils'
import { HttpException } from './HttpException'
import type { Context } from './context'

export type MaybePromise<T> = T | Promise<T>

export type Routes = Array<{
	path: string
	handler: WobeHandler
	method: HttpMethod
}>

export interface WobeOptions {
	hostname?: string
}

export type HttpMethod = 'POST' | 'GET' | 'DELETE' | 'PUT'

export type WobeHandlerOutput =
	| void
	| Promise<void>
	| undefined
	| Response
	| Promise<Response>

export type WobeHandler = (
	ctx: Context,
	wobeResponse: WobeResponse,
) => WobeHandlerOutput

export type WobePlugin = (wobe: Wobe) => void

export type Hook = 'beforeHandler' | 'afterHandler' | 'beforeAndAfterHandler'

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

	async usePlugin(plugin: MaybePromise<WobePlugin>) {
		// TODO : Maybe throw an error if the usePlugin is not await and the plugin is a promise
		if (plugin instanceof Promise) {
			await plugin.then((p) => {
				return p(this)
			})

			return this
		}

		plugin(this)
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

		const router = this.router

		// Benchmark:
		// Full = 40 793 ns
		// Empty = 33 597 ns
		this.server = Bun.serve({
			port,
			hostname: this.options?.hostname,
			development: false,
			error: (err) => {
				if (err instanceof HttpException) return err.response

				return new Response(err.message, {
					status: Number(err.code) || 500,
				})
			},
			async fetch(req) {
				const { pathName } = extractPathnameAndSearchParams(req)

				const route = router.findRoute(
					req.method as HttpMethod,
					pathName || '/',
				)

				if (!route) return new Response(null, { status: 404 })

				const context: Context = {
					// TODO : Check if we add the requestIP to a middleware to avoid useless compute here
					ipAdress: this.requestIP(req)?.address || '',
					request: req,
					state: 'beforeHandler',
				}

				const wobeResponse = new WobeResponse(req)

				const middlewareBeforeHandler =
					route.beforeHandlerMiddleware || []
				// We need to run middleware sequentially
				for (let i = 0; i < middlewareBeforeHandler.length; i++) {
					const middleware = middlewareBeforeHandler[i]

					await middleware(context, wobeResponse)
				}

				context.state = 'handler'

				const resultHandler = await route.handler?.(
					context,
					wobeResponse,
				)

				if (resultHandler instanceof Response && !wobeResponse.response)
					wobeResponse.response = resultHandler

				context.state = 'afterHandler'

				const middlewareAfterHandler =
					route.afterHandlerMiddleware || []
				// We need to run middleware sequentially
				let responseAfterMiddleware = undefined
				for (let i = 0; i < middlewareAfterHandler.length; i++) {
					const middleware = middlewareAfterHandler[i]

					responseAfterMiddleware = await middleware(
						context,
						wobeResponse,
					)
				}

				if (responseAfterMiddleware instanceof Response)
					return responseAfterMiddleware

				return (
					wobeResponse.response || new Response(null, { status: 404 })
				)
			},
		})
	}

	stop() {
		this.server?.stop()
	}
}
