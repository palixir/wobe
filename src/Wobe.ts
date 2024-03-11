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
	routes: Routes
}

export type HttpMethod = 'POST' | 'GET' | 'DELETE' | 'PUT'

export type WobeHandler = (
	req: Request,
	wobeResponse: WobeResponse,
) => Promise<Response> | Response | void | Promise<void>

export class Wobe {
	private options: WobeOptions
	private server: Server
	private router: Router

	constructor(options: WobeOptions) {
		this.options = options
		this.router = new Router()

		this.router.compile(options.routes)

		this.server = this.start(this.router)
	}

	start(router: Router) {
		return Bun.serve({
			port: this.options.port,
			hostname: this.options.hostname,
			development: false,
			async fetch(req) {
				const { pathName, searchParams } =
					extractPathnameAndSearchParams(req.url)

				const route = router.find({
					path: pathName,
					method: req.method as HttpMethod,
				})

				if (route) {
					const wobeResponse = new WobeResponse(req)

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
