import { describe, expect, it } from 'bun:test'
import { WobeResponse } from '../WobeResponse'
import { cors } from './cors'

describe('Cors middleware', () => {
	const request = new Request('http://localhost:3000/test')
	const optionsRequest = new Request('http://localhost:3000/test', {
		method: 'OPTIONS',
	})

	it('should allow origin to * when to origin is specifid', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors()

		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'*',
		)
		expect(wobeResponse.headers.get('Vary')).toBeNull()
	})

	it('should set origin to Vary if the origin is !== *', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: 'http://localhost:3000',
		})

		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Vary')).toBe('Origin')
	})

	it('should not set origin to Vary if the origin is === *', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors()

		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Vary')).toBeNull()
	})

	it('should correctly allow origin with simple string', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: 'http://localhost:3000',
		})

		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:3000',
		)
	})

	it('should correctly allow origin with an array', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: ['http://localhost:3000', 'http://localhost:3001'],
		})

		// With no origin header
		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:3000',
		)

		// With an origin header
		handler(
			{
				request: new Request('http://localhost:3000/test', {
					headers: {
						origin: 'http://localhost:3001',
					},
				}),
			},
			wobeResponse,
		)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:3001',
		)
	})

	it('should correctly allow origin with a function', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: (origin) => {
				if (origin === 'http://localhost:3000')
					return 'http://localhost:3000'

				return 'http://localhost:3001'
			},
		})

		// With no origin header
		handler({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:3001',
		)

		// With an origin header
		handler(
			{
				request: new Request('http://localhost:3000/test', {
					headers: {
						origin: 'http://localhost:3000',
					},
				}),
			},
			wobeResponse,
		)

		expect(wobeResponse.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:3000',
		)
	})

	it('should allow credentials', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})

		handler({ request }, wobeResponse)

		expect(
			wobeResponse.headers.get('Access-Control-Allow-Credentials'),
		).toBe('true')
	})

	it('should not allow credentials', async () => {
		const wobeResponse = new WobeResponse(request)

		const handler = cors({
			origin: 'http://localhost:3000',
			credentials: false,
		})

		handler({ request }, wobeResponse)

		expect(
			wobeResponse.headers.get('Access-Control-Allow-Credentials'),
		).toBeNull()
	})

	it('should control expose headers', async () => {
		const wobeResponse = new WobeResponse(request)

		const handlerWithExposeHeaders = cors({
			origin: 'http://localhost:3000',
			exposeHeaders: ['X-Test'],
		})

		handlerWithExposeHeaders({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Expose-Headers')).toBe(
			'X-Test',
		)
	})

	it('should have expose headers to null when no expose headers is defined', async () => {
		const wobeResponse = new WobeResponse(request)

		const handlerWithoutExposeHeaders = cors({
			origin: 'http://localhost:3000',
		})

		handlerWithoutExposeHeaders({ request }, wobeResponse)

		expect(
			wobeResponse.headers.get('Access-Control-Expose-Headers'),
		).toBeNull()
	})

	it('should not set max age for others request than OPTIONS', async () => {
		const wobeResponse = new WobeResponse(request)

		const handlerWithMaxAge = cors({
			origin: 'http://localhost:3000',
			maxAge: 100,
		})

		handlerWithMaxAge({ request }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Max-Age')).toBeNull()
	})

	it('should set max age for OPTIONS request if defined', async () => {
		const wobeResponse = new WobeResponse(optionsRequest)

		const handlerWithMaxAge = cors({
			origin: 'http://localhost:3000',
			maxAge: 100,
		})

		handlerWithMaxAge({ request: optionsRequest }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Max-Age')).toBe('100')
	})

	it('should not set allow methods for others requests than OPTIONS', async () => {
		const wobeResponse = new WobeResponse(request)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowMethods: ['GET', 'POST'],
		})

		handlerWithAllowMethods({ request }, wobeResponse)

		expect(
			wobeResponse.headers.get('Access-Control-Allow-Methods'),
		).toBeNull()
	})

	it('should set allow methods for OPTIONS requests', async () => {
		const wobeResponse = new WobeResponse(optionsRequest)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowMethods: ['GET', 'POST'],
		})

		handlerWithAllowMethods({ request: optionsRequest }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Methods')).toBe(
			'GET,POST',
		)
	})

	it('should set allow headers with an allow headers on OPTIONS requests', async () => {
		const wobeResponse = new WobeResponse(optionsRequest)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowHeaders: ['X-Test'],
		})

		handlerWithAllowMethods({ request: optionsRequest }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Headers')).toBe(
			'X-Test',
		)
		expect(wobeResponse.headers.get('Vary')).toBe(
			'Origin, Access-Control-Request-Headers',
		)
	})

	it('should set allow headers without an allow headers on OPTIONS request', async () => {
		const customRequest = new Request('http://localhost:3000/test', {
			method: 'OPTIONS',
			headers: {
				'Access-Control-Request-Headers': 'X-Test',
			},
		})

		const wobeResponse = new WobeResponse(customRequest)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		handlerWithAllowMethods({ request: customRequest }, wobeResponse)

		expect(wobeResponse.headers.get('Access-Control-Allow-Headers')).toBe(
			'X-Test',
		)

		expect(wobeResponse.headers.get('Vary')).toBe(
			'Origin, Access-Control-Request-Headers',
		)
	})

	it('should delete Content-Lenght and Content-type on OPTIONS request', async () => {
		const wobeResponse = new WobeResponse(optionsRequest)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		wobeResponse.headers.set('Content-Length', '100')
		wobeResponse.headers.set('Content-Type', 'application/json')

		handlerWithAllowMethods({ request: optionsRequest }, wobeResponse)

		expect(wobeResponse.headers.get('Content-Length')).toBeNull()
		expect(wobeResponse.headers.get('Content-Type')).toBeNull()
	})

	it('should return response on requests OPTIONS', async () => {
		const wobeResponse = new WobeResponse(optionsRequest)

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		await handlerWithAllowMethods({ request: optionsRequest }, wobeResponse)

		expect(wobeResponse.status).toBe(204)
		expect(wobeResponse.statusText).toBe('OK')
	})
})
