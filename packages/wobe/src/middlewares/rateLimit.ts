import type { WobeHandler } from '../Wobe'

export interface RateLimitOptions {}

export const rateLimit = (options: RateLimitOptions): WobeHandler => {
	return (ctx, res) => {
		console.log(ctx.ipAdress)
	}
}
