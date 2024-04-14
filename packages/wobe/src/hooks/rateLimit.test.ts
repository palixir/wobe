import { describe, expect, it, mock } from 'bun:test'
import { rateLimit } from './rateLimit'
import { Context } from '../Context'

// @ts-expect-error
const mockHttpExceptionConstructor = mock((response: Response) => {})

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

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 100,
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		for (let i = 0; i < 100; i++) handler(context)

		expect(() => handler(context)).toThrow()
	})

	it('should limit the number of request by second', () => {
		const request = new Request('http://localhost:3000/test')

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		handler(context)
		handler(context)

		expect(() => handler(context)).toThrow()
	})

	it('should limit the number of request by second', () => {
		const request = new Request('http://localhost:3000/test')

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		handler(context)
		handler(context)

		expect(() => handler(context)).toThrow()
	})

	it('should clear the number of request each interval', async () => {
		const request = new Request('http://localhost:3000/test')

		const handler = rateLimit({
			interval: 100,
			numberOfRequests: 2,
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		handler(context)
		handler(context)

		await new Promise((resolve) => setTimeout(resolve, 100))

		expect(() => handler(context)).not.toThrow()
	})

	it('should authorize 2 requests by user', () => {
		const request = new Request('http://localhost:3000/test')

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 2,
		})

		const context = new Context(request)

		handler(context)
		handler(context)

		expect(() => handler(context)).toThrow()

		context.getIpAdress = () => 'ipAdress2'

		handler(context)
		handler(context)

		expect(() => handler(context)).toThrow()
	})

	it('should throw the correct http error', async () => {
		const request = new Request('http://localhost:3000/test')

		const handler = rateLimit({
			interval: 1000,
			numberOfRequests: 2,
		})

		const context = new Context(request)

		handler(context)
		handler(context)

		expect(() => handler(context)).toThrow()

		const responseFromHttpException = mockHttpExceptionConstructor.mock
			.calls[0][0] as Response

		expect(responseFromHttpException.status).toBe(429)
		expect(await responseFromHttpException.text()).toBe(
			'Rate limit exceeded',
		)
	})
})
