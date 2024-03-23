import { describe, expect, it, mock, beforeEach } from 'bun:test'
import { logger } from './logger'
import { WobeResponse } from '../WobeResponse'
import type { Context } from '../context'

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

		const context: Context = { state: 'beforeHandler', request }

		handler(context, new WobeResponse(request))

		expect(mockLoggerFunction).toHaveBeenCalledTimes(1)
		expect(mockLoggerFunction).toHaveBeenCalledWith({
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

		const context: Context = { state: 'beforeHandler', request }

		// We begin to handle the beforeHandler to get the requestStartTimeInMs
		handler(context, new WobeResponse(request))

		context.state = 'afterHandler'

		handler(context, new WobeResponse(request))

		expect(mockLoggerFunction).toHaveBeenCalledTimes(2)
		expect(mockLoggerFunction).toHaveBeenNthCalledWith(2, {
			method: 'GET',
			url: 'http://localhost:3000/test',
			status: 200,
			requestStartTimeInMs: expect.any(Number),
		})
	})
})
