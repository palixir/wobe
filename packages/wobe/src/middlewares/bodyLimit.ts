import { HttpException } from '../HttpException'
import type { WobeHandler } from '../Wobe'

interface BodyLimitOptions {
	maxSize: number
}

export const bodyLimit = (options: BodyLimitOptions): WobeHandler => {
	return (req, res) => {
		// The content-length header is not always present
		if (req.headers.get('Content-Length')) {
			const contentLength = Number(req.headers.get('Content-Length') || 0)

			if (contentLength > options.maxSize)
				throw new HttpException(
					new Response('Payload too large', { status: 413 }),
				)
		}
	}
}
