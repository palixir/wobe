import { HttpException } from '../HttpException'
import type { WobeHandler } from '../Wobe'
import { WobeStore } from '../tools'

export interface RateLimitOptions {
	interval: number
	numberOfRequests: number
}

/**
 * rateLimit is a hook that limits the number of requests per interval
 */
export const rateLimit = ({ interval, numberOfRequests }: RateLimitOptions): WobeHandler<any> => {
	const store = new WobeStore<number>({
		interval,
	})

	return (ctx) => {
		const ipAdress = ctx.getIpAdress()

		const userRequests = store.get(ipAdress) || 0

		if (userRequests >= numberOfRequests)
			throw new HttpException(new Response('Rate limit exceeded', { status: 429 }))

		store.set(ipAdress, userRequests + 1)
	}
}
