import type { Server } from 'bun'
import { WobeResponse } from './WobeResponse'
import { Router } from './router'
import { extractPathnameAndSearchParams } from './utils'

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
	| Promise<Response>
	| Response
	| void
	| Promise<void>
	| undefined

export type WobeHandler = (
	req: Request,
	wobeResponse: WobeResponse,
) => WobeHandlerOutput

export type WobePlugin = (wobe: Wobe) => void

export class Wobe {
	private options: WobeOptions
	private server: Server | null
	private routes: Routes
	private middlewares: Array<{
		pathname: string | WobeHandler
		handler: WobeHandler
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

	use(arg1: string | WobeHandler, ...handlers: WobeHandler[]) {
		let path = arg1

		if (typeof arg1 !== 'string') {
			path = '*'
			handlers.unshift(arg1)
		}

		handlers.map((handler) => {
			this.middlewares.push({ pathname: path, handler })
		})
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
				return new Response(err.message, { status: 500 })
			},
			async fetch(req) {
				const { pathName, searchParams } =
					extractPathnameAndSearchParams(req.url)

				const route = router.find({
					path: pathName || '/',
					method: req.method as HttpMethod,
				})

				if (route) {
					const wobeResponse = new WobeResponse(req)

					// We need to run middleware sequentially
					const res = await middlewares
						.filter(
							(middleware) =>
								middleware.pathname === '*' ||
								middleware.pathname === pathName,
						)
						.reduce(
							async (acc, middleware) => {
								await acc

								return middleware.handler(req, wobeResponse)
							},
							Promise.resolve({} as WobeHandlerOutput),
						)

					if (res instanceof Response)
						return route?.handler?.(req, res)

					return route?.handler?.(req, wobeResponse)
				}

				return new Response(null, { status: 404 })
			},
		})
	}

	stop() {
		this.server?.stop()
	}
}
