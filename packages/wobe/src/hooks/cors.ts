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

/**
 * cors is a hook that adds the necessary headers to enable CORS
 */
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

	return (ctx) => {
		const requestOrigin = ctx.request.headers.get('origin') || ''

		const getAllowOrigin = (origin: Origin) => {
			if (typeof origin === 'string') return origin

			if (typeof origin === 'function') return origin(requestOrigin)

			return origin.includes(requestOrigin) ? requestOrigin : origin[0]
		}

		const allowOrigin = getAllowOrigin(opts.origin)

		if (allowOrigin)
			ctx.res.headers.set('Access-Control-Allow-Origin', allowOrigin)

		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
		if (opts.origin !== '*') ctx.res.headers.set('Vary', 'Origin')

		if (opts.credentials)
			ctx.res.headers.set('Access-Control-Allow-Credentials', 'true')

		if (opts.exposeHeaders?.length)
			ctx.res.headers.set(
				'Access-Control-Expose-Headers',
				opts.exposeHeaders.join(','),
			)

		if (ctx.request.method === 'OPTIONS') {
			if (opts.maxAge)
				ctx.res.headers.set(
					'Access-Control-Max-Age',
					opts.maxAge.toString(),
				)

			if (opts.allowMethods?.length)
				ctx.res.headers.set(
					'Access-Control-Allow-Methods',
					opts.allowMethods.join(','),
				)

			const headers = opts.allowHeaders?.length
				? opts.allowHeaders
				: ctx.request.headers
						.get('Access-Control-Request-Headers')
						?.split(/\s*,\s*/)

			if (headers?.length) {
				ctx.res.headers.set(
					'Access-Control-Allow-Headers',
					headers.join(','),
				)
				ctx.res.headers?.append(
					'Vary',
					'Access-Control-Request-Headers',
				)
			}

			ctx.res.headers?.delete('Content-Length')
			ctx.res.headers?.delete('Content-Type')

			ctx.res.status = 204
			ctx.res.statusText = 'OK'
		}
	}
}
