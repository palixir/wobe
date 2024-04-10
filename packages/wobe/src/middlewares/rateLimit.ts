import { HttpException } from '../HttpException'
import type { WobeHandler } from '../Wobe'
import { WobeStore } from '../store/WobeStore'

export interface RateLimitOptions {
	interval: number
	numberOfRequests: number
}

export const rateLimit = ({
	interval,
	numberOfRequests,
}: RateLimitOptions): WobeHandler => {
	const store = new WobeStore({
		interval,
	})

	return (ctx) => {
		const ipAdress = ctx.getIpAdress(ctx.request)

		const userRequests = store.get(ipAdress) || 0

		if (userRequests >= numberOfRequests)
			throw new HttpException(
				new Response('Rate limit exceeded', { status: 429 }),
			)

		store.set(ipAdress, userRequests + 1)
	}
}
