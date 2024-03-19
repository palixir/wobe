import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { Wobe } from './Wobe'
import getPort from 'get-port'
import { csrf } from './middlewares'

describe('Wobe e2e', async () => {
	let wobe: Wobe
	const port = await getPort()

	beforeAll(() => {
		wobe = new Wobe({ port })

		wobe.use(csrf({ origin: `http://127.0.0.1:${port}` }))

		wobe.get('/test', (_, res) => {
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
})
