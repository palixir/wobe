import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { Wobe } from './Wobe'

describe('Wobe', () => {
	let wobe: Wobe

	beforeAll(() => {
		wobe = new Wobe({
			port: 3000,
			routes: [
				{
					path: '/testGet',
					handler: () => new Response('Test'),
					method: 'GET',
				},
				{
					path: '/testPost',
					handler: () => new Response('Test'),
					method: 'POST',
				},
			],
		})
	})

	afterAll(() => {
		wobe.close()
	})

	it('should return 404 if the url is not found', async () => {
		const res = await fetch('http://127.0.0.1:3000/notfound')

		expect(res.status).toBe(404)
		expect(await res.text()).toBe('Not found')

		wobe.close()
	})

	it('should return 200 on successfull get request', async () => {
		const res = await fetch('http://127.0.0.1:3000/testGet')

		expect(res.status).toBe(200)

		wobe.close()
	})

	it('should return 200 on successfull post request', async () => {
		const res = await fetch('http://127.0.0.1:3000/testPost')

		expect(res.status).toBe(200)

		wobe.close()
	})
})
