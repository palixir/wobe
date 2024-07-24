import { describe, expect, it, mock, spyOn } from 'bun:test'
import { Context } from './Context'

describe('Context', () => {
	it('should execute handler correctly', async () => {
		const context = new Context(new Request('https://example.com'))

		const mockHandler = mock(() => new Response('Hello World'))
		const mockBeforeHandler = mock(() => {
			expect(context.state).toEqual('beforeHandler')
		})
		const mockAfterHandler = mock(() => {
			expect(context.state).toEqual('afterHandler')
		})

		context.handler = mockHandler
		context.beforeHandlerHook = [mockBeforeHandler]
		context.afterHandlerHook = [mockAfterHandler]

		await context.executeHandler()

		expect(mockHandler).toHaveBeenCalledTimes(1)
		expect(await context.res.response?.text()).toEqual('Hello World')
		expect(mockBeforeHandler).toHaveBeenCalledTimes(1)
		expect(mockAfterHandler).toHaveBeenCalledTimes(1)
	})

	it('should return the response from after handler if return a Response object', async () => {
		const context = new Context(new Request('https://example.com'))

		const mockHandler = mock(() => new Response('Hello World'))

		const mockAfterHandler = mock(() => {
			return new Response('Response from after handler')
		})

		context.handler = mockHandler
		context.afterHandlerHook = [mockAfterHandler]

		const res = await context.executeHandler()

		expect(await res.text()).toEqual('Response from after handler')
		expect(mockHandler).toHaveBeenCalledTimes(1)
		expect(mockAfterHandler).toHaveBeenCalledTimes(1)
	})

	it('should correctly initialize context', () => {
		const request = new Request('https://example.com')
		const context = new Context(request)

		expect(context.request).toEqual(request)
		expect(context.res).toBeDefined()
		expect(context.state).toEqual('beforeHandler')
		expect(context.requestStartTimeInMs).toBeUndefined()
	})

	it('should redirect client to a specific url', () => {
		const request = new Request('https://example.com')
		const context = new Context(request)

		const spyContextRes = spyOn(context.res, 'send')

		context.redirect('https://example.com/test')

		expect(context.res.headers.get('Location')).toEqual(
			'https://example.com/test',
		)
		expect(context.res.status).toEqual(302)

		expect(spyContextRes).toHaveBeenCalledTimes(1)
		expect(spyContextRes).toHaveBeenCalledWith('OK')

		// Redirect permanently
		context.redirect('https://example.com/test2', 301)

		expect(context.res.headers.get('Location')).toEqual(
			'https://example.com/test2',
		)
		expect(context.res.status).toEqual(301)
	})
})
