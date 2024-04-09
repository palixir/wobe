import type { WobeHandler } from '../Wobe'

type Origin =
	| string
	| string[]
	| ((origin: string) => string | undefined | null)

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

	return (ctx, res) => {
		const requestOrigin = ctx.request.headers.get('origin') || ''

		const getAllowOrigin = (origin: Origin) => {
			if (typeof origin === 'string') return origin

			if (typeof origin === 'function') return origin(requestOrigin)

			return origin.includes(requestOrigin) ? requestOrigin : origin[0]
		}

		const allowOrigin = getAllowOrigin(opts.origin)

		if (allowOrigin)
			res.headers.set('Access-Control-Allow-Origin', allowOrigin)

		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
		if (opts.origin !== '*') res.headers.set('Vary', 'Origin')

		if (opts.credentials)
			res.headers.set('Access-Control-Allow-Credentials', 'true')

		if (opts.exposeHeaders?.length)
			res.headers.set(
				'Access-Control-Expose-Headers',
				opts.exposeHeaders.join(','),
			)

		if (ctx.request.method === 'OPTIONS') {
			if (opts.maxAge)
				res.headers.set(
					'Access-Control-Max-Age',
					opts.maxAge.toString(),
				)

			if (opts.allowMethods?.length)
				res.headers.set(
					'Access-Control-Allow-Methods',
					opts.allowMethods.join(','),
				)

			const headers = opts.allowHeaders?.length
				? opts.allowHeaders
				: ctx.request.headers
						.get('Access-Control-Request-Headers')
						?.split(/\s*,\s*/)

			if (headers?.length) {
				res.headers.set(
					'Access-Control-Allow-Headers',
					headers.join(','),
				)
				res.headers?.append('Vary', 'Access-Control-Request-Headers')
			}

			res.headers?.delete('Content-Length')
			res.headers?.delete('Content-Type')

			res.status = 204
			res.statusText = 'OK'
		}
	}
}
