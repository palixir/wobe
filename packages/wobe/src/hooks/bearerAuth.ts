import { createHash } from 'node:crypto'
import { HttpException } from '../HttpException'
import type { WobeHandler } from '../Wobe'

export interface BearerAuthOptions {
	token: string
	realm?: string
	hashFunction?: (token: string) => string
}

const prefix = 'Bearer'

const defaultHash = (token: string) =>
	createHash('sha256').update(token).digest('base64')

/**
 * bearerAuth is a hook that checks if the request has a valid Bearer token
 */
export const bearerAuth = ({
	token,
	hashFunction = defaultHash,
	realm = '',
}: BearerAuthOptions): WobeHandler<any> => {
	return (ctx) => {
		const requestAuthorization = ctx.request.headers.get('Authorization')

		if (!requestAuthorization)
			throw new HttpException(
				new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `${prefix} realm="${realm}", error="invalid_request"`,
					},
				}),
			)

		if (!requestAuthorization.startsWith(prefix))
			throw new HttpException(
				new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `${prefix} realm="${realm}", error="invalid_request"`,
					},
				}),
			)

		const requestToken = requestAuthorization.slice(prefix.length).trim()

		const hashedRequestToken = hashFunction(requestToken)
		const hashedToken = hashFunction(token)

		if (hashedToken !== hashedRequestToken)
			throw new HttpException(
				new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `${prefix} realm="${realm}", error="invalid_token"`,
					},
				}),
			)
	}
}
