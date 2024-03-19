import type { WobeHandler } from '../Wobe'
import type { Origin } from './index'

export interface CorsOptions {
	origin: Origin
	allowMethods?: string[]
	allowHeaders?: string[]
	maxAge?: number
	credentials?: boolean
	exposeHeaders?: string[]
}

export const cors = (options?: CorsOptions): WobeHandler => {
	const defaults: CorsOptions = {
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowHeaders: [],
		exposeHeaders: [],
	}

	const opts = {
		...defaults,
		...options,
	}

	return (req, res) => {
		const requestOrigin = req.headers.get('origin') || ''

		const getAllowOrigin = (origin: Origin) => {
			if (typeof origin === 'string') return origin

			if (typeof origin === 'function') return origin(requestOrigin)

			return origin.includes(requestOrigin) ? requestOrigin : origin[0]
		}

		const allowOrigin = getAllowOrigin(opts.origin)

		if (allowOrigin)
			res.setHeaders('Access-Control-Allow-Origin', allowOrigin)

		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
		if (opts.origin !== '*') res.setHeaders('Vary', 'Origin')

		if (opts.credentials)
			res.setHeaders('Access-Control-Allow-Credentials', 'true')

		if (opts.exposeHeaders?.length)
			res.setHeaders(
				'Access-Control-Expose-Headers',
				opts.exposeHeaders.join(','),
			)

		if (req.method === 'OPTIONS') {
			if (opts.maxAge)
				res.setHeaders('Access-Control-Max-Age', opts.maxAge.toString())

			if (opts.allowMethods?.length)
				res.setHeaders(
					'Access-Control-Allow-Methods',
					opts.allowMethods.join(','),
				)

			const headers = opts.allowHeaders?.length
				? opts.allowHeaders
				: req.headers
						.get('Access-Control-Request-Headers')
						?.split(/\s*,\s*/)

			if (headers?.length) {
				res.setHeaders(
					'Access-Control-Allow-Headers',
					headers.join(','),
				)
				res.headers.append('Vary', 'Access-Control-Request-Headers')
			}

			res.headers.delete('Content-Length')
			res.headers.delete('Content-Type')

			return new Response(null, {
				headers: res.headers,
				status: 204,
				statusText: res.statusText,
			})
		}
	}
}
