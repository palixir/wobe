import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	spyOn,
	beforeEach,
} from 'bun:test'
import { Wobe } from './Wobe'
import getPort from 'get-port'
import { csrf } from './middlewares'
import { bearerAuth } from './middlewares/bearerAuth'
import { logger } from './middlewares/logger'

describe('Wobe e2e', async () => {
	let wobe: Wobe
	const port = await getPort()

	const spyConsoleLog = spyOn(console, 'log').mockReturnValue()

	beforeAll(() => {
		wobe = new Wobe({ port })

		wobe.beforeHandler(csrf({ origin: `http://127.0.0.1:${port}` }))
		wobe.beforeHandler('/testBearer', bearerAuth({ token: '123' }))
		wobe.beforeAndAfterHandler(logger())

		wobe.get('/test', (_, res) => {
			return res.send('Test')
		})

		wobe.get('/testBearer', (_, res) => {
			return res.send('Test')
		})

		wobe.start()
	})

	afterAll(() => {
		wobe.stop()
	})

	beforeEach(() => {
		spyConsoleLog.mockClear()
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

	it('should log with logger middleware', async () => {
		await fetch(`http://127.0.0.1:${port}/test`, {
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
		expect(spyConsoleLog.mock.calls[1][0]).toContain(`ms]`)
	})
})
