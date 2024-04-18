import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	spyOn,
	mock,
	beforeEach,
} from 'bun:test'
import { Wobe } from './Wobe'
import getPort from 'get-port'
import { csrf } from './hooks'
import { bearerAuth } from './hooks/bearerAuth'
import { logger } from './hooks/logger'

describe('Wobe integration', async () => {
	let wobe: Wobe
	const port = await getPort()

	const spyConsoleLog = spyOn(console, 'log').mockResolvedValue({} as never)
	const mockHookWithWildcardRoute = mock(() => {})

	beforeAll(() => {
		wobe = new Wobe()
			.beforeHandler('/testHookLifecyce', (ctx) => {
				ctx.res.headers.set('X-Test', 'Test')
			})
			.beforeHandler(csrf({ origin: `http://127.0.0.1:${port}` }))
			.beforeHandler('/testBearer', bearerAuth({ token: '123' }))
			.beforeHandler('/test/*', mockHookWithWildcardRoute)

		wobe.beforeAndAfterHandler(logger())

		wobe.afterHandler('/testHookLifecyce', (ctx) => {
			ctx.res.headers.set('X-Test-3', 'Test3')
			return ctx.res.send('Test after handler')
		})

		wobe.get('/testHookLifecyce', (ctx) => {
			ctx.res.headers.set('X-Test-2', 'Test2')

			return ctx.res.send('Test')
		}).get('/ipAdress', (ctx) => {
			ctx.res.send(ctx.getIpAdress())
		})
		wobe.get('/test/v1', (ctx) => {
			return ctx.res.send('Test')
		})
		wobe.get('/test', (ctx) => {
			return ctx.res.send('Test')
		})
			.get('/testBearer', (ctx) => {
				return ctx.res.send('Test')
			})
			.get('/testReturnResponse', () => {
				return new Response('Content', { status: 200 })
			})
			.get('/route/:id/name', (ctx) => {
				if (ctx.query.test) return ctx.res.sendText(ctx.query.test)

				return ctx.res.sendText(ctx.params.id)
			})
			.get('/testStatusText', (ctx) => {
				ctx.res.statusText = 'Test'

				return ctx.res.send('Test')
			})

		wobe.listen(port)
	})

	afterAll(() => {
		wobe.stop()
	})

	beforeEach(() => {
		spyConsoleLog.mockClear()
		mockHookWithWildcardRoute.mockClear()
	})

	it('should return the ip adress of the client', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/ipAdress`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(await res.text()).toBe('::ffff:127.0.0.1')
	})

	// Waiting https://github.com/oven-sh/bun/pull/10266
	it.skip('should return the good statusText of the response', async () => {
		spyConsoleLog.mockRestore()

		const res = await fetch(`http://127.0.0.1:${port}/testStatusText`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(res.statusText).toBe('Test')
	})

	it('should get the route params on a route with parameters', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/route/1/name`)

		expect(await res.text()).toEqual('1')

		const res2 = await fetch(
			`http://127.0.0.1:${port}/route/1/name?test=bun`,
		)

		expect(await res2.text()).toEqual('bun')
	})

	it('should execute hooks with a route name like /test/* for any route begin by /test/', async () => {
		await fetch(`http://127.0.0.1:${port}/test/v1`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(mockHookWithWildcardRoute).toHaveBeenCalledTimes(1)
	})

	it('should return a response directly from a route', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testReturnResponse`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(await res.text()).toEqual('Content')
		expect(res.status).toBe(200)
	})

	it('should block requests with invalid origin', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/test`, {
			headers: {
				origin: 'invalid-origin',
			},
		})

		expect(res.status).toBe(403)
		expect(res.statusText).toBe('Forbidden')
		expect(await res.text()).toBe('CSRF: Invalid origin')
	})

	it('should not block requests with valid origin', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/test`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(res.status).toBe(200)
	})

	it('should block the request if the bearer auth is not valid', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testBearer`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
				Authorization: 'Bearer 1234',
			},
		})

		expect(res.status).toBe(401)
		expect(res.statusText).toBe('Unauthorized')
		expect(res.headers.get('WWW-Authenticate')).toEqual(
			'Bearer realm="", error="invalid_token"',
		)
	})

	it('should log with logger hook', async () => {
		await fetch(`http://127.0.0.1:${port}/test`, {
			method: 'GET',
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(spyConsoleLog).toHaveBeenCalledTimes(2)
		expect(spyConsoleLog).toHaveBeenNthCalledWith(
			1,
			`[Before handler] [GET] http://127.0.0.1:${port}/test`,
		)

		// We don't use toHaveBeenNthCalledWith to avoid flaky on execution time
		expect(spyConsoleLog.mock.calls[1][0]).toContain(
			`[After handler] [GET] http://127.0.0.1:${port}/test (status:200)`,
		)
		expect(spyConsoleLog.mock.calls[1][0]).toContain('ms]')
	})

	it('should have a beforeHandler and afterHandler hook and a route that update response', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testHookLifecyce`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(res.status).toBe(200)
		expect(res.headers.get('X-Test')).toBe('Test')
		expect(res.headers.get('X-Test-2')).toBe('Test2')
		expect(res.headers.get('X-Test-3')).toBe('Test3')
		expect(await res.text()).toBe('Test after handler')
	})
})
