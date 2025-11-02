import { describe, expect, it } from 'bun:test'
import { WobeResponse } from './WobeResponse'

describe('Wobe Response', () => {
	it('should send binary file content', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const fileContent = new Uint8Array([
			71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 255, 0, 192, 192, 192, 0,
			0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2,
			2, 68, 1, 0, 59,
		]).buffer

		const response = wobeResponse.send(fileContent, {
			headers: {
				'Content-Type': 'image/gif',
			},
		})

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('image/gif')

		const responseArrayBuffer = await response.arrayBuffer()
		expect(responseArrayBuffer).toEqual(fileContent)
	})

	it('should send binary file content with Buffer', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const fileContent = Buffer.from('Hello World', 'utf-8')

		const response = wobeResponse.send(fileContent, {
			headers: {
				'Content-Type': 'image/gif',
			},
		})

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('image/gif')

		const responseText = await response.text()

		expect(responseText).toEqual('Hello World')
	})

	it('should send SharedArrayBuffer content', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const sharedBuffer = new SharedArrayBuffer(16)
		const sharedArray = new Uint8Array(sharedBuffer)
		sharedArray.set([
			71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 255, 0, 192, 192, 192,
		])
		const response = wobeResponse.send(sharedBuffer, {
			headers: {
				'Content-Type': 'image/gif',
			},
		})

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('image/gif')

		const responseArrayBuffer = await response.arrayBuffer()

		expect(new Uint8Array(responseArrayBuffer)).toEqual(
			new Uint8Array([
				71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 255, 0, 192, 192, 192,
			]),
		)
	})

	it('should send ArrayBuffer content and compare with original', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const arrayBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer
		const response = wobeResponse.send(arrayBuffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		})

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/octet-stream',
		)

		const responseArrayBuffer = await response.arrayBuffer()

		expect(new Uint8Array(responseArrayBuffer)).toEqual(
			new Uint8Array([1, 2, 3, 4, 5]),
		)
	})

	it('should handle empty ArrayBuffer', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const emptyBuffer = new ArrayBuffer(0)
		const response = wobeResponse.send(emptyBuffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/octet-stream',
		)
		const responseArrayBuffer = await response.arrayBuffer()
		expect(responseArrayBuffer.byteLength).toBe(0)
	})

	it('should handle empty SharedArrayBuffer', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const emptySharedBuffer = new SharedArrayBuffer(0)
		const response = wobeResponse.send(emptySharedBuffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/octet-stream',
		)
		const responseArrayBuffer = await response.arrayBuffer()
		expect(responseArrayBuffer.byteLength).toBe(0)
	})

	it('should handle large SharedArrayBuffer', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const largeSharedBuffer = new SharedArrayBuffer(1024 * 1024) // 1MB
		const largeArray = new Uint8Array(largeSharedBuffer)
		largeArray.fill(42)
		const response = wobeResponse.send(largeSharedBuffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/octet-stream',
		)

		const responseArrayBuffer = await response.arrayBuffer()

		expect(
			new Uint8Array(responseArrayBuffer).every((val) => val === 42),
		).toBeTrue()
	})

	it('should send null content and handle gracefully', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)
		const response = wobeResponse.send(null, {
			headers: {
				'Content-Type': 'text/plain',
			},
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('text/plain')
		const responseText = await response.text()
		expect(responseText).toBe('null')
	})

	it('should clone a Response into a WobeResponse instance', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.headers.set('X-Tata', 'tata')
		wobeResponse.setCookie('cookieName', 'cookieValue')

		const response = new Response()
		response.headers.set('X-Test', 'test')

		const clonedWobeResponse = wobeResponse.copy(response)

		expect(clonedWobeResponse.headers.get('X-Test')).toBe('test')
		expect(clonedWobeResponse.headers.get('X-Tata')).toBe('tata')
		expect(clonedWobeResponse.headers.get('Set-Cookie')).toBe(
			'cookieName=cookieValue;',
		)
		expect(clonedWobeResponse.response?.status).toBe(200)
	})

	it('should set an empty header value', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)
		wobeResponse.headers.set('X-Test', '')
		expect(wobeResponse.headers.get('X-Test')).toBe('')
	})

	it('should send text with correct headers and add another header', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.headers.set('X-Test', 'test')

		const response = wobeResponse.sendText('Hello World')

		expect(response.headers.get('Content-Type')).toBe('text/plain')
		expect(response.headers.get('charset')).toBe('utf-8')
		expect(response.headers.get('X-Test')).toBe('test')
	})

	it('should set a cookie in a response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie('titi', 'test', {
			httpOnly: true,
			domain: 'domain',
			secure: true,
			expires: new Date('2022-01-01'),
			maxAge: 100,
			path: '/path',
			sameSite: 'Strict',
		})

		wobeResponse.setCookie('tata', 'tata')

		expect(wobeResponse.headers?.get('Set-Cookie')).toBe(
			'titi=test; HttpOnly; Path=/path; Domain=domain; Expires=Sat, 01 Jan 2022 00:00:00 GMT; SameSite=Strict; Secure; Max-Age=100;, tata=tata;',
		)
	})

	it('should delete a cookie from a response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie('tata', 'tata')

		wobeResponse.deleteCookie('tata')

		expect(wobeResponse.headers?.get('Set-Cookie')).toBe(
			'tata=tata;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)
	})

	it('should delete two cookies from response', () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test'),
		)

		wobeResponse.setCookie('tata', 'tata')
		wobeResponse.setCookie('titi', 'titi')

		wobeResponse.deleteCookie('tata')

		expect(wobeResponse.headers?.get('Set-Cookie')).toBe(
			'tata=tata;, titi=titi;, tata=; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
		)

		wobeResponse.deleteCookie('titi')

		expect(wobeResponse.headers?.get('Set-Cookie')).toBe(
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

		wobeResponse.status = 201

		const response = wobeResponse.send('Hello World')

		expect(response.status).toBe(201)
	})

	it('should set status text', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		wobeResponse.statusText = 'Created'

		const response = wobeResponse.send('Hello World')

		expect(response.statusText).toBe('Created')
	})

	it('should send text content (with sendText function)', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const response = wobeResponse.sendText('Hello World')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('text/plain')
		expect(response.headers.get('charset')).toBe('utf-8')
		expect(await response.text()).toBe('Hello World')
	})

	it('should send a text body (with send function)', async () => {
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

	it('should send json content (with sendJson function)', async () => {
		const wobeResponse = new WobeResponse(
			new Request('http://localhost:3000/test', {
				method: 'GET',
			}),
		)

		const response = wobeResponse.sendJson({ hello: 'world' })

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Content-Type')).toBe('application/json')
		expect(await response.json()).toEqual({ hello: 'world' })
	})

	it('should send a json body (with send function)', async () => {
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

		wobeResponse.setCookie('tata', 'tata')

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

		wobeResponse.headers.set('Valid-Header', 'valid-value')

		const response = wobeResponse.send('Hello World')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.headers.get('Valid-Header')).toBe('valid-value')
		expect(await response.text()).toBe('Hello World')
	})
})
