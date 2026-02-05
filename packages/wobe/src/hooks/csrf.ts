import type { WobeHandler } from '../Wobe'
import { HttpException } from '../HttpException'

type Origin = string | string[] | ((origin: string) => boolean)

export interface CsrfOptions {
	origin: Origin
}

const isSameOrigin = (optsOrigin: Origin, requestOrigin: string) => {
	if (!requestOrigin) return false
	if (typeof optsOrigin === 'string') return optsOrigin === requestOrigin

	if (typeof optsOrigin === 'function') return optsOrigin(requestOrigin)

	return optsOrigin.includes(requestOrigin)
}

// Reliability on these headers comes from the fact that they cannot be altered programmatically
// as they fall under forbidden headers list, meaning that only the browser can set them.
// https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#using-standard-headers-to-verify-origin

/**
 * csrf is a hook that checks if the request has a valid CSRF token
 */
export const csrf = (options: CsrfOptions): WobeHandler<any> => {
	return (ctx) => {
		const method = ctx.request.method?.toUpperCase?.()

		// Only enforce on non-idempotent methods
		if (!method || method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

		const requestOrigin = ctx.request.headers.get('origin')
		const requestReferer = ctx.request.headers.get('referer')

		// Prefer Origin when available
		if (requestOrigin) {
			if (!isSameOrigin(options.origin, requestOrigin))
				throw new HttpException(
					new Response('CSRF: Invalid origin', {
						status: 403,
						statusText: 'Forbidden',
					}),
				)

			return
		}

		if (requestReferer) {
			try {
				const refererHost = new URL(requestReferer).host
				const requestHost = new URL(ctx.request.url).host

				if (refererHost === requestHost) return
			} catch {
				// fallthrough to rejection
			}
		}

		throw new HttpException(
			new Response('CSRF: Invalid origin', {
				status: 403,
				statusText: 'Forbidden',
			}),
		)
	}
}
