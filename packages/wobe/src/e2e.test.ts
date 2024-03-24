import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { Wobe } from './Wobe'
import getPort from 'get-port'
import { csrf } from './middlewares'
import { bearerAuth } from './middlewares/bearerAuth'

describe('Wobe e2e', async () => {
	let wobe: Wobe
	const port = await getPort()

	beforeAll(() => {
		wobe = new Wobe({ port })

		wobe.beforeHandler(csrf({ origin: `http://127.0.0.1:${port}` }))
		wobe.beforeHandler('/testBearer', bearerAuth({ token: '123' }))

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
})
