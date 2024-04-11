import { describe, expect, it, mock, beforeEach } from 'bun:test'
import { logger } from './logger'
import { Context } from '../Context'

describe('logger', () => {
	const mockLoggerFunction = mock(() => {})

	beforeEach(() => {
		mockLoggerFunction.mockClear()
	})

	it('should log before handler', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer 123',
			},
		})

		const handler = logger({
			loggerFunction: mockLoggerFunction,
		})

		const context = new Context(request)

		handler(context)

		expect(mockLoggerFunction).toHaveBeenCalledTimes(1)
		expect(mockLoggerFunction).toHaveBeenCalledWith({
			beforeHandler: true,
			method: 'GET',
			url: 'http://localhost:3000/test',
		})

		expect(context.requestStartTimeInMs).toBeGreaterThanOrEqual(Date.now())
	})

	it('should log after handler', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer 123',
			},
		})

		const handler = logger({
			loggerFunction: mockLoggerFunction,
		})

		const context = new Context(request)

		// We begin to handle the beforeHandler to get the requestStartTimeInMs
		handler(context)

		context.state = 'afterHandler'

		handler(context)

		expect(mockLoggerFunction).toHaveBeenCalledTimes(2)
		expect(mockLoggerFunction).toHaveBeenNthCalledWith(2, {
			beforeHandler: false,
			method: 'GET',
			url: 'http://localhost:3000/test',
			status: 200,
			requestStartTimeInMs: expect.any(Number),
		})
	})
})
