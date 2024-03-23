import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	mock,
	afterEach,
} from 'bun:test'
import getPort from 'get-port'
import { Wobe } from './Wobe'
import type { WobeResponse } from './WobeResponse'
import { HttpException } from './HttpException'

describe('Wobe', async () => {
	let wobe: Wobe
	const mockMiddleware = mock(() => {})
	const mockSecondMiddleware = mock(() => {})
	const mockOnlyOnTestGet = mock(() => {})
	const mockTestGet = mock(() => {})

	const port = await getPort()

	beforeAll(() => {
		wobe = new Wobe({
			port,
		})

		wobe.get('/testGet', (_, res) => {
			mockTestGet()
			return res.send('Test')
		})

		wobe.post('/testPost', (_, res) => {
			return res.send('Tata')
		})

		wobe.use(mockMiddleware)
		wobe.use(mockSecondMiddleware)
		wobe.use('/testGet', mockOnlyOnTestGet)

		wobe.start()
	})

	afterAll(() => {
		wobe.stop()
	})

	afterEach(() => {
		mockMiddleware.mockClear()
		mockSecondMiddleware.mockClear()
		mockOnlyOnTestGet.mockClear()
		mockTestGet.mockClear()
	})

	it('should return 404 if the url is not found', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/notfound`)

		expect(res.status).toBe(404)
		expect(await res.text()).toBe('')
	})

	it('should return 200 on successfull get request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockTestGet).toHaveBeenCalledTimes(1)
		expect(res.status).toBe(200)
	})

	it('should return 200 on successfull post request', async () => {
		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(res.status).toBe(200)
	})

	it('should handle middlewares before any request', async () => {
		await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockMiddleware).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockMiddleware.mock.calls[0][0].request.method).toBe('GET')
		// @ts-expect-error
		expect(mockMiddleware.mock.calls[0][0].request.url).toBe(
			`http://127.0.0.1:${port}/testGet`,
		)

		expect(mockSecondMiddleware).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockSecondMiddleware.mock.calls[0][0].request.method).toBe('GET')
		// @ts-expect-error
		expect(mockSecondMiddleware.mock.calls[0][0].request.url).toBe(
			`http://127.0.0.1:${port}/testGet`,
		)

		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)
	})

	it('should handle middlewares only on specific path', async () => {
		await fetch(`http://127.0.0.1:${port}/testGet`)

		expect(mockMiddleware).toHaveBeenCalledTimes(1)
		expect(mockSecondMiddleware).toHaveBeenCalledTimes(1)
		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)

		await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(mockMiddleware).toHaveBeenCalledTimes(2)
		expect(mockSecondMiddleware).toHaveBeenCalledTimes(2)
		expect(mockOnlyOnTestGet).toHaveBeenCalledTimes(1)
	})

	it('should handle middlewares sequentially', async () => {
		// @ts-expect-error
		mockMiddleware.mockImplementation((req: Request, res: WobeResponse) => {
			// Executed first
			res.setStatus(205)

			return res
		})

		mockSecondMiddleware.mockImplementation(
			// @ts-expect-error
			(req: Request, res: WobeResponse) => {
				// Executed second
				res.setStatus(206)

				return res
			},
		)

		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(res.status).toBe(206)

		mockMiddleware.mockRestore()
		mockSecondMiddleware.mockRestore()
	})

	it('should skip handler if one of middleware throw an error', async () => {
		mockMiddleware.mockImplementation(() => {
			throw new HttpException(
				new Response('Middleware error', { status: 200 }),
			)
		})

		const res = await fetch(`http://127.0.0.1:${port}/testPost`, {
			method: 'POST',
		})

		expect(await res.text()).toEqual('Middleware error')
		expect(mockTestGet).toHaveBeenCalledTimes(0)

		mockMiddleware.mockRestore()
	})
})
