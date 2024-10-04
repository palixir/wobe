import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	mock,
	spyOn,
	afterEach,
} from 'bun:test'
import getPort from 'get-port'
import { Wobe } from './Wobe'
import { HttpException } from './HttpException'
import type { Context } from './Context'
import * as nodeAdapter from './adapters/node'
import * as bunAdapter from './adapters/bun'
import { bearerAuth, csrf, logger } from './hooks'
import { WobeStore } from './tools'

describe('Wobe', () => {
	let wobe: Wobe<any>
	const mockHookOnSpecificRoute = mock(() => {})
	const mockHook = mock(() => {})
	const mockSecondHook = mock(() => {})
	const mockHookBeforeAndAfterHandler = mock(() => {})
	const mockHookOnlyBeforeHandler = mock(() => {})
	const mockOnlyOnTestGet = mock(() => {})
	const mockTestGet = mock(() => {})
	const mockTestPost = mock(() => {})
	const mockTestPut = mock(() => {})
	const mockTestDelete = mock(() => {})
	const mockAllMethod = mock(() => {})
	const mockPluginRoute = mock(() => {})
	const mockUsePlugin = mock(() => {
		return (wobe: any) => {
			wobe.get('/routeCreatedByPlugin', (ctx: any) => {
				mockPluginRoute()
				return ctx.res.send('routeCreatedByPlugin')
			})
		}
	})
	const mockOnError = mock(() => {})
	const mockOnNotFound = mock(() => {})
	const mockHookWithWildcardRoute = mock(() => {})
	const mockOptions = mock(() => {})
	const spyConsoleLog = spyOn(console, 'log').mockResolvedValue({} as never)

	let port: number

	beforeAll(async () => {
		port = await getPort()

		wobe = new Wobe({
			onError: mockOnError,
			onNotFound: mockOnNotFound,
		})
			.get('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
			.post('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
			.put('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
			.delete('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
			.all('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
			.get('/route/:id/name', (ctx) => {
				if (ctx.query.test) return ctx.res.sendText(ctx.query.test)

				return ctx.res.sendText(ctx.params.id)
			})
			.get('/testGet', (ctx) => {
				mockTestGet()
				return ctx.res.send('Test')
			})
			.get('/ipAdress', (ctx) => {
				ctx.res.send(ctx.getIpAdress())
			})
			.post('/testPost', (ctx) => {
				mockTestPost()
				return ctx.res.send('Tata')
			})
			.put('/testPut', (ctx) => {
				mockTestPut()
				return ctx.res.send('Put')
			})
			.delete('/testDelete', (ctx) => {
				mockTestDelete()
				return ctx.res.send('Delete')
			})
			.all('/allMethod', (ctx) => {
				mockAllMethod()
				return ctx.res.send('All')
			})
			.get('/test/v1', (ctx) => {
				return ctx.res.send('Test')
			})
			.get('/testReturnResponse', () => {
				return new Response('Content', { status: 200 })
			})
			.get('/test', (ctx) => {
				return ctx.res.send('Test')
			})
			.post('/testRequestBodyCache', async (ctx) => {
				return ctx.res.send(await ctx.request.text())
			})
			.get('/testBearer', (ctx) => {
				return ctx.res.send('Test')
			})
			.get('/testHookLifecyce', (ctx) => {
				ctx.res.headers.set('X-Test-2', 'Test2')

				return ctx.res.send('Test')
			})
			.get('/testStatusText', (ctx) => {
				ctx.res.statusText = 'Test'

				return ctx.res.send('Test')
			})
			.get('/testAfterHandlerCache', (ctx) => {
				expect(ctx.state).toEqual('beforeHandler')

				return ctx.res.send(ctx.state)
			})
			.get('/testContextCache', (ctx) => {
				return ctx.res.send('Hello world')
			})
			.get('/testPromiseResponse', (ctx) => {
				return Promise.resolve(ctx.res.send('Hello world'))
			})
			.get('/testBasicError', () => {
				throw new Error('Test error')
			})
			.get('/testHttpExceptionError', () => {
				throw new HttpException(
					new Response('Test error', { status: 400 }),
				)
			})
			.get('/1', (ctx) => {
				ctx.res.headers.set('X-Test', 'Test')

				return ctx.res.send('1')
			})
			.get('/2', (ctx) => {
				ctx.res.headers.set('X-Test', 'Test2')

				return ctx.res.send('2')
			})
			.get('/name/with/slash', (ctx) => {
				return ctx.res.send('OK')
			})
			.get('/upload', async () => {
				return new Response(
					Bun.file(`${__dirname}/../fixtures/testFile.html`),
					{
						headers: {
							'Content-Type': 'text/html',
						},
					},
				)
			})
			.options('/options', async (ctx) => {
				mockOptions()
				return ctx.res.send('OK')
			})
			.usePlugin(mockUsePlugin())
			.beforeHandler(
				'/test/',
				csrf({ origin: `http://127.0.0.1:${port}` }),
			)
			.beforeAndAfterHandler(logger())
			.beforeHandler('/testBearer', bearerAuth({ token: '123' }))
			.beforeHandler('/test/*', mockHookWithWildcardRoute)
			.beforeHandler(mockHook)
			.beforeHandler(mockSecondHook)
			.beforeHandler(mockHookOnlyBeforeHandler)
			.beforeHandler('/testGet', mockOnlyOnTestGet)
			.beforeAndAfterHandler(mockHookBeforeAndAfterHandler)
			.beforeHandler('/testHookLifecyce', (ctx) => {
				ctx.res.headers.set('X-Test', 'Test')
			})
			.afterHandler('/testHookLifecyce', (ctx) => {
				ctx.res.headers.set('X-Test-3', 'Test3')
				return ctx.res.send('Test after handler')
			})
			.afterHandler('/testAfterHandlerCache', (ctx) => {
				return new Response(ctx.state)
			})
			.listen(port)
	})

	afterAll(() => {
		wobe.stop()
	})

	afterEach(() => {
		mockUsePlugin.mockClear()
		mockPluginRoute.mockClear()
		mockHook.mockClear()
		mockSecondHook.mockClear()
		mockHookBeforeAndAfterHandler.mockClear()
		mockHookOnlyBeforeHandler.mockClear()
		mockOnlyOnTestGet.mockClear()
		mockAllMethod.mockClear()
		mockTestGet.mockClear()
		mockTestPost.mockClear()
		mockTestPut.mockClear()
		mockTestDelete.mockClear()
		mockOnError.mockClear()
		mockOnNotFound.mockClear()
		mockHookWithWildcardRoute.mockClear()
		spyConsoleLog.mockClear()
		mockOptions.mockClear()
	})

	it.skipIf(process.env.NODE_TEST !== 'true')(
		'should call Node runtime adapter',
		async () => {
			const spyNodeAdapter = spyOn(nodeAdapter, 'NodeAdapter')

			const wobe = new Wobe().listen(5555)

			expect(spyNodeAdapter).toHaveBeenCalledTimes(1)

			wobe.stop()
		},
	)

	it.skipIf(process.env.NODE_TEST === 'true')(
		'should call Bun runtime adapter',
		async () => {
			const spyBunAdapter = spyOn(bunAdapter, 'BunAdapter')

			const wobe = new Wobe().listen(5555)

			expect(spyBunAdapter).toHaveBeenCalledTimes(1)

			wobe.stop()
		},
	)

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

	it.skipIf(process.env.NODE_TEST === 'true')(
		'should upload a file',
		async () => {
			const res = await fetch(`http://127.0.0.1:${port}/upload`)

			expect(await res.text()).toBe('<html>\ntestfile\n</html>\n')
			expect(res.headers.get('Content-Type')).toBe('text/html')
			expect(res.status).toBe(200)
		},
	)

	it('should run options route', async () => {
		await fetch(`http://127.0.0.1:${port}/options`, {
			method: 'OPTIONS',
		})

		expect(mockOptions).toHaveBeenCalledTimes(1)
	})

	it('should not run hook on all routes (with not the same http method) when specified on specific route with * path', async () => {
		const fakeRouteHook = mock(() => {})

		const localWobe = new Wobe()
		const localPort = await getPort()

		localWobe.get('*', () => new Response(null), fakeRouteHook)
		localWobe.get('/tata', () => new Response('tata'))
		localWobe.post('/toto', (ctx) => {
			return ctx.res.send('test')
		})

		localWobe.listen(localPort)

		await fetch(`http://127.0.0.1:${localPort}/tata`)

		expect(fakeRouteHook).toHaveBeenCalledTimes(1)

		const res = await fetch(`http://127.0.0.1:${localPort}/toto`, {
			method: 'POST',
		})

		expect(await res.text()).toEqual('test')
		expect(fakeRouteHook).toHaveBeenCalledTimes(1)

		localWobe.stop()
	})

	it('should create wobe app with custom context', async () => {
		const wobeWithContext = new Wobe<{
			customType: string
		}>().get('/test', (ctx) => {
			ctx.customType = 'test'

			return ctx.res.send(ctx.customType)
		})

		const port = await getPort()

		wobeWithContext.listen(port)

		const res = await fetch(`http://127.0.0.1:${port}/test`)

		expect(await res.text()).toEqual('test')

		wobeWithContext.stop()
	})

	it('should call callback on listen', async () => {
		const localPort = await getPort()

		const mockCallback = mock((hostname: string, listenPort: number) => {
			expect(hostname).toBe('localhost')
			expect(listenPort).toBe(localPort)
		})

		const localWobe = new Wobe().listen(
			localPort,
			({ hostname, port: listenPort }) => {
				mockCallback(hostname, listenPort)
			},
		)

		expect(mockCallback).toHaveBeenCalledTimes(1)

		localWobe.stop()
	})

	it('should works with request cache (same request but different body)', async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/testRequestBodyCache`,
			{
				method: 'POST',
				body: '1',
			},
		)

		expect(await res.text()).toBe('1')

		const res2 = await fetch(
			`http://127.0.0.1:${port}/testRequestBodyCache`,
			{
				method: 'POST',
				body: '2',
			},
		)

		expect(await res2.text()).toBe('2')
	})

	it('should separate headers from two response', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/1`)

		expect(res.headers.get('X-Test')).toBe('Test')
		expect(await res.text()).toBe('1')

		const res2 = await fetch(`http://127.0.0.1:${port}/2`)

		expect(res2.headers.get('X-Test')).toBe('Test2')
		expect(await res2.text()).toBe('2')
	})

	it('should return a response in case of error in handler', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testBasicError`)

		expect(await res.text()).toBe('Test error')
		expect(res.status).toBe(500)

		const res2 = await fetch(
			`http://127.0.0.1:${port}/testHttpExceptionError`,
		)

		expect(await res2.text()).toBe('Test error')
		expect(res2.status).toBe(400)
	})

	it('should return a promise of Response', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testPromiseResponse`)

		expect(await res.text()).toBe('Hello world')
		expect(res.status).toBe(200)
	})

	it('should have the correct state if there is afterHandler middleware (with context cache)', async () => {
		const res = await fetch(
			`http://127.0.0.1:${port}/testAfterHandlerCache`,
		)

		expect(await res.text()).toBe('afterHandler')

		// Expect is done in the handler
		await fetch(`http://127.0.0.1:${port}/testAfterHandlerCache`)
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

	it('should not block requests with valid origin', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/test`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

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

	it('should return a response directly from a route', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testReturnResponse`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(await res.text()).toEqual('Content')
		expect(res.status).toBe(200)
	})

	it('should execute hooks with a route name like /test/* for any route begin by /test/', async () => {
		await fetch(`http://127.0.0.1:${port}/test/v1`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(mockHookWithWildcardRoute).toHaveBeenCalledTimes(1)
	})

	it('should get the route params on a route with parameters', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/route/1/name`)

		expect(await res.text()).toEqual('1')

		const res2 = await fetch(
			`http://127.0.0.1:${port}/route/1/name?test=bun`,
		)

		expect(await res2.text()).toEqual('bun')
	})

	it('should return the ip adress of the client', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/ipAdress`, {
			headers: {
				origin: `http://127.0.0.1:${port}`,
			},
		})

		expect(await res.text()).toBe('::ffff:127.0.0.1')
	})

	it('should call a hook on a specific route', async () => {
		await fetch(`http://127.0.0.1:${port}/testRouteWithHook`, {
			method: 'GET',
		})

		// +1 because we have the ALL request
		expect(mockHookOnSpecificRoute).toHaveBeenCalledTimes(2)

		await fetch(`http://127.0.0.1:${port}/testRouteWithHook`, {
			method: 'POST',
		})

		// +1 because we have the ALL request
		expect(mockHookOnSpecificRoute).toHaveBeenCalledTimes(4)

		await fetch(`http://127.0.0.1:${port}/testRouteWithHook`, {
			method: 'PUT',
		})

		// +1 because we have the ALL request
		expect(mockHookOnSpecificRoute).toHaveBeenCalledTimes(6)

		await fetch(`http://127.0.0.1:${port}/testRouteWithHook`, {
			method: 'DELETE',
		})

		// +1 because we have the ALL request
		expect(mockHookOnSpecificRoute).toHaveBeenCalledTimes(8)
	})

	it('should call the route create by the plugin', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/routeCreatedByPlugin`)

		expect(res.status).toBe(200)
		expect(await res.text()).toBe('routeCreatedByPlugin')
		expect(mockPluginRoute).toHaveBeenCalledTimes(1)
	})

	it('should return 404 if the url is not found', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/notfound`)

		expect(res.status).toBe(404)
		expect(await res.text()).toBe('')
		expect(mockOnNotFound).toHaveBeenCalledTimes(1)
		expect(mockOnNotFound).toHaveBeenCalledWith(expect.any(Request))
	})

	it('should return 200 on successfull get request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockTestGet).toHaveBeenCalledTimes(1)
		expect(res.status).toBe(200)
		expect(mockOnError).toHaveBeenCalledTimes(0)
	})

	it('should return 200 on successfull post request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(mockTestPost).toHaveBeenCalledTimes(1)
		expect(res.status).toBe(200)
		expect(mockOnError).toHaveBeenCalledTimes(0)
	})

	it('should return 200 on successfull put request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testPut`, {
			method: 'PUT',
		})

		expect(mockTestPut).toHaveBeenCalledTimes(1)
		expect(res.status).toBe(200)
		expect(mockOnError).toHaveBeenCalledTimes(0)
	})

	it('should return 200 on successfull delete request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testDelete`, {
			method: 'DELETE',
		})

		expect(mockTestDelete).toHaveBeenCalledTimes(1)
		expect(res.status).toBe(200)
		expect(mockOnError).toHaveBeenCalledTimes(0)
	})

	it('should return 200 on successfull ALL method request', async () => {
		await fetch(`http://127.0.0.1:${port}/allMethod`, {
			method: 'GET',
		})
		await fetch(`http://127.0.0.1:${port}/allMethod`, {
			method: 'POST',
		})
		await fetch(`http://127.0.0.1:${port}/allMethod`, {
			method: 'PUT',
		})
		await fetch(`http://127.0.0.1:${port}/allMethod`, {
			method: 'DELETE',
		})

		expect(mockAllMethod).toHaveBeenCalledTimes(4)
	})

	it('should handle beforeHandler hook on path with slash', async () => {
		await fetch(`http://127.0.0.1:${port}/name/with/slash`)

		expect(mockHook).toHaveBeenCalledTimes(1)

		await fetch(`http://127.0.0.1:${port}/testPost`, { method: 'POST' })

		expect(mockHook).toHaveBeenCalledTimes(2)
	})

	it('should handle hooks before any request', async () => {
		await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockHook).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockHook.mock.calls[0][0].request.method).toBe('GET')
		// @ts-expect-error
		expect(mockHook.mock.calls[0][0].request.url).toBe(
			`http://127.0.0.1:${port}/testGet`,
		)

		expect(mockSecondHook).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockSecondHook.mock.calls[0][0].request.method).toBe('GET')
		// @ts-expect-error
		expect(mockSecondHook.mock.calls[0][0].request.url).toBe(
			`http://127.0.0.1:${port}/testGet`,
		)

		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)
	})

	it('should handle hooks only on specific path', async () => {
		await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockHook).toHaveBeenCalledTimes(1)
		expect(mockSecondHook).toHaveBeenCalledTimes(1)
		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)

		await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(mockHook).toHaveBeenCalledTimes(2)
		expect(mockSecondHook).toHaveBeenCalledTimes(2)
		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)
	})

	it('should handle hooks sequentially', async () => {
		// @ts-expect-error
		mockHook.mockImplementation((ctx: Context) => {
			// Executed first
			ctx.res.status = 205

			return ctx.res
		})

		mockSecondHook.mockImplementation(
			// @ts-expect-error
			(ctx: Context) => {
				// Executed second
				ctx.res.status = 206

				return ctx.res
			},
		)

		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(res.status).toBe(206)

		mockHook.mockRestore()
		mockSecondHook.mockRestore()
	})

	it('should skip handler if one of hook throw an error', async () => {
		mockHook.mockImplementation(() => {
			throw new HttpException(new Response('Hook error', { status: 200 }))
		})

		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(await res.text()).toEqual('Hook error')
		expect(mockTestGet).toHaveBeenCalledTimes(0)

		mockHook.mockRestore()
	})

	it('should handle a hook only before handler', async () => {
		await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(mockHookOnlyBeforeHandler).toHaveBeenCalledTimes(1)
	})

	it('should handle a hook before and after handler', async () => {
		await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(mockHookBeforeAndAfterHandler).toHaveBeenCalledTimes(2)
	})

	it('should handle onError if the handler has an error', async () => {
		mockTestGet.mockImplementation(() => {
			throw new Error('Test error')
		})

		await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockOnError).toHaveBeenCalledTimes(1)

		mockTestGet.mockRestore()
	})
})
