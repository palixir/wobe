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
		expect(context.body).toEqual({})
	})

	it('should redirect client to a specific url', () => {
		const request = new Request('https://example.com')
		const context = new Context(request)

		context.redirect('https://example.com/test')

		expect(context.res.headers.get('Location')).toEqual(
			'https://example.com/test',
		)
		expect(context.res.status).toEqual(302)

		// Redirect permanently
		context.redirect('https://example.com/test2', 301)

		expect(context.res.headers.get('Location')).toEqual(
			'https://example.com/test2',
		)
		expect(context.res.status).toEqual(301)
	})
})
