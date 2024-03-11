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
		})
	})

	afterAll(() => {
		wobe.close()
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
})
