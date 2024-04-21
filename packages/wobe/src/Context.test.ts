import { describe, expect, it, mock, beforeEach } from 'bun:test'
import { Context, _routeStore } from './Context'

describe('Context', () => {
	beforeEach(() => {
		_routeStore.clear()
	})

	it('should call only one time the findRoute with cache', () => {
		const mockFindRoute = mock(() => {})

		const request = new Request('https://example.com')
		new Context(request, {
			findRoute: mockFindRoute,
		} as any)

		expect(mockFindRoute).toHaveBeenCalledTimes(1)

		new Context(request, {
			findRoute: mockFindRoute,
		} as any)

		expect(mockFindRoute).toHaveBeenCalledTimes(1)
	})

	it('should call two times the findRoute with cache but differents http method', () => {
		const mockFindRoute = mock(() => {})

		const request = new Request('https://example.com', {
			method: 'GET',
		})
		const request2 = new Request('https://example.com', {
			method: 'POST',
		})

		new Context(request, {
			findRoute: mockFindRoute,
		} as any)

		expect(mockFindRoute).toHaveBeenCalledTimes(1)

		new Context(request2, {
			findRoute: mockFindRoute,
		} as any)

		expect(mockFindRoute).toHaveBeenCalledTimes(2)
	})

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
