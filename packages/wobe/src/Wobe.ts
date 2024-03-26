import type { Server } from 'bun'
import { WobeResponse } from './WobeResponse'
import { Router } from './router'
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
	port: number
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

type Hook = 'beforeHandler' | 'afterHandler' | 'beforeAndAfterHandler'

// TODO : Create assert before middleware if it's specific to a type of hook (before, after, beforeAndAfter)
export class Wobe {
	private options: WobeOptions
	private server: Server | null
	private routes: Routes
	private middlewares: Array<{
		pathname: string | WobeHandler
		handler: WobeHandler
		hook: Hook
	}>

	constructor(options: WobeOptions) {
		this.options = options
		this.routes = []
		this.middlewares = []
		this.server = null
	}

	get(path: string, handler: WobeHandler) {
		this.routes.push({ path, handler, method: 'GET' })
	}

	post(path: string, handler: WobeHandler) {
		this.routes.push({ path, handler, method: 'POST' })
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
				this.middlewares.push({ pathname: path, handler, hook })
			})
		}

	beforeAndAfterHandler(
		arg1: string | WobeHandler,
		...handlers: WobeHandler[]
	) {
		this._addMiddleware('beforeAndAfterHandler')(arg1, ...handlers)
	}

	beforeHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		this._addMiddleware('beforeHandler')(arg1, ...handlers)
	}

	afterHandler(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		this._addMiddleware('afterHandler')(arg1, ...handlers)
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

	start() {
		const router = new Router()

		router.compile(this.routes)

		const middlewares = this.middlewares

		this.server = Bun.serve({
			port: this.options.port,
			hostname: this.options.hostname,
			development: false,
			error: (err) => {
				if (err instanceof HttpException) return err.response

				return new Response(err.message, {
					status: Number(err.code) || 500,
				})
			},
			async fetch(req) {
				const { pathName } = extractPathnameAndSearchParams(req.url)

				const route = router.find({
					path: pathName || '/',
					method: req.method as HttpMethod,
				})

				if (route) {
					const context: Context = {
						ipAdress: this.requestIP(req)?.address || '',
						request: req,
						state: 'beforeHandler',
					}

					const wobeResponse = new WobeResponse(req)

					const listOfMiddlewaresToExecute = []

					for (let i = 0; i < middlewares.length; i++) {
						const currentMiddleware = middlewares[i]

						if (
							router.isMiddlewarePathnameMatchWithRoute({
								middlewarePathname:
									currentMiddleware.pathname as string,
								route: pathName as string, // A route has been founded so we are pretty sure
							})
						)
							listOfMiddlewaresToExecute.push(currentMiddleware)
					}

					// We need to run middleware sequentially
					await listOfMiddlewaresToExecute
						.filter(
							(middleware) =>
								middleware.hook === 'beforeHandler' ||
								middleware.hook === 'beforeAndAfterHandler',
						)
						.reduce(
							async (acc, middleware) => {
								await acc

								return middleware.handler(context, wobeResponse)
							},
							Promise.resolve({} as WobeHandlerOutput),
						)

					context.state = 'handler'

					const handlerResult = await route.handler?.(
						context,
						wobeResponse,
					)

					if (handlerResult instanceof Response)
						wobeResponse.copyResponse(handlerResult)

					context.state = 'afterHandler'

					// We need to run middleware sequentially
					const responseAfterMiddleware =
						await listOfMiddlewaresToExecute
							.filter(
								(middleware) =>
									middleware.hook === 'afterHandler' ||
									middleware.hook === 'beforeAndAfterHandler',
							)
							.reduce(
								async (acc, middleware) => {
									await acc

									return middleware.handler(
										context,
										wobeResponse,
									)
								},
								Promise.resolve({} as WobeHandlerOutput),
							)

					if (responseAfterMiddleware instanceof Response)
						return responseAfterMiddleware

					return new Response(wobeResponse.body, {
						status: wobeResponse.status,
						headers: wobeResponse.headers,
						statusText: wobeResponse.statusText,
					})
				}

				return new Response(null, { status: 404 })
			},
		})
	}

	stop() {
		this.server?.stop()
	}
}
