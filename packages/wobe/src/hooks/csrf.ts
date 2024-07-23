import type { WobeHandler } from '../Wobe'
import { HttpException } from '../HttpException'

type Origin = string | string[] | ((origin: string) => boolean)

export interface CsrfOptions {
	origin: Origin
}

const isSameOrigin = (optsOrigin: Origin, requestOrigin: string) => {
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
		const requestOrigin = ctx.request.headers.get('origin') || ''

		if (!isSameOrigin(options.origin, requestOrigin))
			throw new HttpException(
				new Response('CSRF: Invalid origin', { status: 403 }),
			)
	}
}
