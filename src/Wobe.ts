import type { Server } from 'bun'
import { WobeResponse } from './WobeResponse'

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

	constructor(options: WobeOptions) {
		this.options = options

		this.server = this.start(options.routes)
	}

	start(routes: Routes) {
		return Bun.serve({
			port: this.options.port,
			hostname: this.options.hostname,
			development: false,
			async fetch(req) {
				const urlRoute = `/${req.url.split('/')[3]}`

				const route = routes.find((route) => route.path === urlRoute)

				if (route) {
					const wobeResponse = new WobeResponse(req)

					await route?.handler(req, wobeResponse)

					return wobeResponse.getResponse()
				}

				return new Response('Not found', { status: 404 })
			},
		})
	}

	close() {
		this.server.stop()
	}
}
