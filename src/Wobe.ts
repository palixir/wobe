import type { Server } from 'bun'
import { WobeResponse } from './WobeResponse'
import { Router } from './router'
import { extractPathnameAndSearchParams } from './utils'

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

export type WobeHandler = (
	req: Request,
	wobeResponse: WobeResponse,
) => Promise<Response> | Response | void | Promise<void>

export class Wobe {
	private options: WobeOptions
	private server: Server
	private routes: Routes
	private middlewares: Array<{ pathname: string; handler: WobeHandler }>

	constructor(options: WobeOptions) {
		this.options = options
		this.routes = []
		this.middlewares = []
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

	start() {
		const router = new Router()

		router.compile(this.routes)

		const middlewares = this.middlewares

		this.server = Bun.serve({
			port: this.options.port,
			hostname: this.options.hostname,
			development: false,
			async fetch(req) {
				const { pathName, searchParams } =
					extractPathnameAndSearchParams(req.url)

				const route = router.find({
					path: pathName || '/',
					method: req.method as HttpMethod,
				})

				if (route) {
					const wobeResponse = new WobeResponse(req)

					// Run middlewares
					await Promise.all(
						middlewares
							.filter(
								(middleware) =>
									middleware.pathname === '*' ||
									middleware.pathname === pathName,
							)
							.map((middleware) =>
								middleware.handler(req, wobeResponse),
							),
					)

					await route?.handler?.(req, wobeResponse)

					return wobeResponse.getResponse()
				}

				return new Response(null, { status: 404 })
			},
		})
	}

	close() {
		this.server.stop()
	}
}
