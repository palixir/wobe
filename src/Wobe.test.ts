import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	mock,
	afterEach,
} from 'bun:test'
import { Wobe } from './Wobe'

describe('Wobe', () => {
	let wobe: Wobe
	const mockMiddleware = mock(() => {})
	const mockSecondMiddleware = mock(() => {})

	beforeAll(() => {
		wobe = new Wobe({
			port: 3000,
			routes: [
				{
					path: '/testGet',
					handler: (req, res) => {
						res.send('Test')
					},
					method: 'GET',
				},
				{
					path: '/testPost',
					handler: (req, res) => {
						res.send('Tata')
					},
					method: 'POST',
				},
			],
			middlewares: [
				{ handler: mockMiddleware },
				{ handler: mockSecondMiddleware },
			],
		})
	})

	afterAll(() => {
		wobe.close()
	})

	afterEach(() => {
		mockMiddleware.mockClear()
		mockSecondMiddleware.mockClear()
	})

	it('should return 404 if the url is not found', async () => {
		const res = await fetch('http://127.0.0.1:3000/notfound')

		expect(res.status).toBe(404)
		expect(await res.text()).toBe('')
	})

	it('should return 200 on successfull get request', async () => {
		const res = await fetch('http://127.0.0.1:3000/testGet')

		expect(res.status).toBe(200)
	})

	it('should return 200 on successfull post request', async () => {
		const res = await fetch('http://127.0.0.1:3000/testPost', {
			method: 'POST',
		})

		expect(res.status).toBe(200)
	})

	it('should handle middlewares before any request', async () => {
		await fetch('http://127.0.0.1:3000/testGet')

		expect(mockMiddleware).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockMiddleware.mock.calls[0][0].method).toBe('GET')
		// @ts-expect-error
		expect(mockMiddleware.mock.calls[0][0].url).toBe(
			'http://127.0.0.1:3000/testGet',
		)

		expect(mockSecondMiddleware).toHaveBeenCalledTimes(1)
		// @ts-expect-error
		expect(mockSecondMiddleware.mock.calls[0][0].method).toBe('GET')
		// @ts-expect-error
		expect(mockSecondMiddleware.mock.calls[0][0].url).toBe(
			'http://127.0.0.1:3000/testGet',
		)
	})
})
