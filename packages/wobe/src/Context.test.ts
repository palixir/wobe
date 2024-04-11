import { describe, expect, it } from 'bun:test'
import { Context } from './Context'

describe('Context', () => {
	it('should correctly initialize context', () => {
		const request = new Request('https://example.com')
		const context = new Context(request)

		expect(context.request).toEqual(request)
		expect(context.res).toBeDefined()
		expect(context.ipAdress).toBeUndefined()
		expect(context.state).toEqual('beforeHandler')
		expect(context.requestStartTimeInMs).toBeUndefined()
		expect(context.body).toBeUndefined()
	})

	it('should return a json object', async () => {
		const request = new Request('https://example.com', {
			body: JSON.stringify({ name: 'John Doe' }),
		})
		const context = new Context(request)

		const json = await context.json()

		expect(json).toEqual({ name: 'John Doe' })
	})

	it('should return a text', async () => {
		const request = new Request('https://example.com', {
			body: 'Hello, World!',
		})
		const context = new Context(request)

		const text = await context.text()

		expect(text).toEqual('Hello, World!')
	})
})
