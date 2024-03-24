import { describe, expect, it, spyOn, mock } from 'bun:test'
import { rateLimit } from './rateLimit'
import { WobeResponse } from '../WobeResponse'
import { HttpException } from '../HttpException'

const mockHttpExceptionConstructor = mock(() => {})

mock.module('../HttpException', () => ({
	HttpException: class HttpException {
		constructor(response: Response) {
			mockHttpExceptionConstructor(response)
		}
	},
}))

describe('rateLimit', () => {
	it('should authorize the number of request - 1 by second', () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 100,
		})

		for (let i = 0; i < 100; i++)
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).toThrow()
	})

	it('should limit the number of request by second', () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).toThrow()
	})

	it('should limit the number of request by second', () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).toThrow()
	})

	it('should clear the number of request each interval', async () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		await new Promise((resolve) => setTimeout(resolve, 100))

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).not.toThrow()
	})

	it('should authorize 2 requests by user', () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 2,
		})

		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).toThrow()

		handler({ request, ipAdress: 'ipAdress2' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress2' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress2' }, wobeResponse),
		).toThrow()
	})

	it('should throw the correct http error', async () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 2,
		})

		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)
		handler({ request, ipAdress: 'ipAdress' }, wobeResponse)

		expect(() =>
			handler({ request, ipAdress: 'ipAdress' }, wobeResponse),
		).toThrow()

		const responseFromHttpException =
			// @ts-expect-error
			mockHttpExceptionConstructor.mock.calls[0][0] as Response

		expect(responseFromHttpException.status).toBe(429)
		expect(await responseFromHttpException.text()).toBe(
			'Rate limit exceeded',
		)
	})
})
