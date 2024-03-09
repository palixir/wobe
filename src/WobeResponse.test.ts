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

		expect(wobeResponse.getResponse().headers.get('Set-Cookie')).toBe(
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

		expect(wobeResponse.getResponse().headers.get('Set-Cookie')).toBe(
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

		expect(wobeResponse.getResponse().headers.get('Set-Cookie')).toBe(
			'tata=tata;, titi=titi;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)

		wobeResponse.deleteCookie('titi')

		expect(wobeResponse.getResponse().headers.get('Set-Cookie')).toBe(
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

	it('should send a text body', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.send('Hello World')

		const response = wobeResponse.getResponse()

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

		wobeResponse.send({ a: 1, b: 2 })

		const response = wobeResponse.getResponse()

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('application/json')
		expect(await response.json()).toEqual({ a: 1, b: 2 })
	})
})
