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

describe('Wobe', () => {
	let wobe: Wobe
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

	let port: number

	beforeAll(async () => {
		port = await getPort()

		wobe = new Wobe({
			onError: mockOnError,
			onNotFound: mockOnNotFound,
		})

		wobe.get('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
		wobe.post('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
		wobe.put('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
		wobe.delete('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)
		wobe.all('/testRouteWithHook', () => {}, mockHookOnSpecificRoute)

		wobe.get('/testGet', (ctx) => {
			mockTestGet()
			return ctx.res.send('Test')
		})

		wobe.post('/testPost', (ctx) => {
			mockTestPost()
			return ctx.res.send('Tata')
		})

		wobe.put('/testPut', (ctx) => {
			mockTestPut()
			return ctx.res.send('Put')
		})

		wobe.delete('/testDelete', (ctx) => {
			mockTestDelete()
			return ctx.res.send('Delete')
		})

		wobe.all('/allMethod', (ctx) => {
			mockAllMethod()
			return ctx.res.send('All')
		})

		wobe.usePlugin(mockUsePlugin())

		wobe.beforeHandler(mockHook)
		wobe.beforeHandler(mockSecondHook)
		wobe.beforeHandler(mockHookOnlyBeforeHandler)
		wobe.beforeHandler('/testGet', mockOnlyOnTestGet)
		wobe.beforeAndAfterHandler(mockHookBeforeAndAfterHandler)

		wobe.listen(port)
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
