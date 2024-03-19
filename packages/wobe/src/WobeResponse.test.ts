import { describe, expect, it } from 'bun:test'
import { WobeResponse } from './WobeResponse'

describe('Wobe Response', () => {
	it('should set a cookie in a response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie({
			name: 'titi',
			value: 'test',
			httpOnly: true,
			domain: 'domain',
			secure: true,
			expires: new Date('2022-01-01'),
			maxAge: 100,
			path: '/path',
			sameSite: 'Strict',
		})

		wobeResponse.setCookie({
			name: 'tata',
			value: 'tata',
		})

		expect(wobeResponse.headers.get('Set-Cookie')).toBe(
			'titi=test; HttpOnly; Path=/path; Domain=domain; Expires=Sat, 01 Jan 2022 00:00:00 GMT; SameSite=Strict; Secure; Max-Age=100;, tata=tata;',
		)
	})

	it('should delete a cookie from a response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie({
			name: 'tata',
			value: 'tata',
		})

		wobeResponse.deleteCookie('tata')

		expect(wobeResponse.headers.get('Set-Cookie')).toBe(
			'tata=tata;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)
	})

	it('should delete two cookies from response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie({
			name: 'tata',
			value: 'tata',
		})

		wobeResponse.setCookie({
			name: 'titi',
			value: 'titi',
		})

		wobeResponse.deleteCookie('tata')

		expect(wobeResponse.headers.get('Set-Cookie')).toBe(
			'tata=tata;, titi=titi;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)

		wobeResponse.deleteCookie('titi')

		expect(wobeResponse.headers.get('Set-Cookie')).toBe(
			'tata=tata;, titi=titi;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;, titi=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)
	})

	it('should get a cookie', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				headers: { Cookie: 'tata=tata; titi=titi;' },
			}),
		)

		expect(wobeResponse.getCookie('tata')).toBe('tata')
		expect(wobeResponse.getCookie('titi')).toBe('titi')
		expect(wobeResponse.getCookie('toto')).toBeUndefined()
	})

	it('should set status', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.setStatus(201)

		const response = wobeResponse.send('Hello World')

		expect(response.status).toBe(201)
	})

	it('should set status text', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.setStatusText('Created')

		const response = wobeResponse.send('Hello World')

		expect(response.statusText).toBe('Created')
	})

	it('should send a text body', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const response = wobeResponse.send('Hello World')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('text/plain')
		expect(response.headers.get('charset')).toBe('utf-8')
		expect(await response.text()).toBe('Hello World')
	})

	it('should send a json body', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const response = wobeResponse.send({ a: 1, b: 2 })

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('application/json')
		expect(await response.json()).toEqual({ a: 1, b: 2 })
	})

	it('should send a json body with status and statusText', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const response = wobeResponse.send(
			{ a: 1, b: 2 },
			{ status: 201, statusText: 'Created' },
		)

		expect(response.status).toBe(201)
		expect(response.statusText).toBe('Created')
		expect(response.headers.get('Content-Type')).toBe('application/json')
		expect(await response.json()).toEqual({ a: 1, b: 2 })
	})

	it('should set headers in send method and overwrite existant', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.setCookie({ name: 'tata', value: 'tata' })

		const response = wobeResponse.send('Hello World', {
			headers: {
				'Content-Type': 'text/html',
				charset: 'utf-7',
			},
		})

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('text/html')
		expect(response.headers.get('Set-Cookie')).toBe('tata=tata;')
		expect(response.headers.get('charset')).toBe('utf-7') // We owerwrite the header if already set
		expect(await response.text()).toBe('Hello World')
	})

	it('should set headers', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.setHeaders('Content-Type', 'invalid-content-type')

		const response = wobeResponse.send('Hello World')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe(
			'invalid-content-type',
		)
		expect(await response.text()).toBe('Hello World')
	})
})
