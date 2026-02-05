import { describe, expect, it } from 'bun:test'
import { cors } from './cors'
import { Context } from '../Context'

describe('Cors hook', () => {
	const request = new Request('http://localhost:3000/test')
	const optionsRequest = new Request('http://localhost:3000/test', {
		method: 'OPTIONS',
	})

	it('should allow origin to * when to origin is specifid', async () => {
		const handler = cors()

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Origin')).toBe('*')
		expect(context.res.headers?.get('Vary')).toBeNull()
	})

	it('should set origin to Vary if the origin is !== *', async () => {
		const handler = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Vary')).toBe('Origin')
	})

	it('should not set origin to Vary if the origin is === *', async () => {
		const handler = cors()

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Vary')).toBeNull()
	})

	it('should correctly allow origin with simple string', async () => {
		const handler = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
	})

	it('should correctly allow origin with an array', async () => {
		const handler = cors({
			origin: ['http://localhost:3000', 'http://localhost:3001'],
		})

		// With no origin header
		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')

		const context2 = new Context(
			new Request('http://localhost:3000/test', {
				headers: {
					origin: 'http://localhost:3001',
				},
			}),
		)

		// With an origin header
		handler(context2)

		expect(context2.res.headers?.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001')
	})

	it('should correctly allow origin with a function', async () => {
		const handler = cors({
			origin: (origin) => {
				if (origin === 'http://localhost:3000') return 'http://localhost:3000'

				return 'http://localhost:3001'
			},
		})

		// With no origin header
		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001')

		const context2 = new Context(
			new Request('http://localhost:3000/test', {
				headers: {
					origin: 'http://localhost:3000',
				},
			}),
		)

		// With an origin header
		handler(context2)

		expect(context2.res.headers?.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
	})

	it('should allow credentials', async () => {
		const handler = cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Credentials')).toBe('true')
	})

	it('should not allow credentials', async () => {
		const handler = cors({
			origin: 'http://localhost:3000',
			credentials: false,
		})

		const context = new Context(request)

		handler(context)

		expect(context.res.headers?.get('Access-Control-Allow-Credentials')).toBeNull()
	})

	it('should control expose headers', async () => {
		const handlerWithExposeHeaders = cors({
			origin: 'http://localhost:3000',
			exposeHeaders: ['X-Test'],
		})

		const context = new Context(request)

		handlerWithExposeHeaders(context)

		expect(context.res.headers?.get('Access-Control-Expose-Headers')).toBe('X-Test')
	})

	it('should have expose headers to null when no expose headers is defined', async () => {
		const handlerWithoutExposeHeaders = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(request)

		handlerWithoutExposeHeaders(context)

		expect(context.res.headers?.get('Access-Control-Expose-Headers')).toBeNull()
	})

	it('should not set max age for others request than OPTIONS', async () => {
		const handlerWithMaxAge = cors({
			origin: 'http://localhost:3000',
			maxAge: 100,
		})

		const context = new Context(request)

		handlerWithMaxAge(context)

		expect(context.res.headers?.get('Access-Control-Max-Age')).toBeNull()
	})

	it('should set max age for OPTIONS request if defined', async () => {
		const handlerWithMaxAge = cors({
			origin: 'http://localhost:3000',
			maxAge: 100,
		})

		const context = new Context(optionsRequest)

		handlerWithMaxAge(context)

		expect(context.res.headers?.get('Access-Control-Max-Age')).toBe('100')
	})

	it('should not set allow methods for others requests than OPTIONS', async () => {
		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowMethods: ['GET', 'POST'],
		})

		const context = new Context(request)

		handlerWithAllowMethods(context)

		expect(context.res.headers?.get('Access-Control-Allow-Methods')).toBeNull()
	})

	it('should set allow methods for OPTIONS requests', async () => {
		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowMethods: ['GET', 'POST'],
		})

		const context = new Context(optionsRequest)

		handlerWithAllowMethods(context)

		expect(context.res.headers?.get('Access-Control-Allow-Methods')).toBe('GET,POST')
	})

	it('should set allow headers with an allow headers on OPTIONS requests', async () => {
		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
			allowHeaders: ['X-Test'],
		})

		const context = new Context(optionsRequest)

		handlerWithAllowMethods(context)

		expect(context.res.headers?.get('Access-Control-Allow-Headers')).toBe('X-Test')
		expect(context.res.headers?.get('Vary')).toBe('Origin, Access-Control-Request-Headers')
	})

	it('should set allow headers without an allow headers on OPTIONS request', async () => {
		const customRequest = new Request('http://localhost:3000/test', {
			method: 'OPTIONS',
			headers: {
				'Access-Control-Request-Headers': 'X-Test',
			},
		})

		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(customRequest)

		handlerWithAllowMethods(context)

		expect(context.res.headers?.get('Access-Control-Allow-Headers')).toBe('X-Test')

		expect(context.res.headers?.get('Vary')).toBe('Origin, Access-Control-Request-Headers')
	})

	it('should delete Content-Lenght and Content-type on OPTIONS request', async () => {
		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(optionsRequest)

		context.res.headers.set('Content-Length', '100')
		context.res.headers.set('Content-Type', 'application/json')

		handlerWithAllowMethods(context)

		expect(context.res.headers?.get('Content-Length')).toBeNull()
		expect(context.res.headers?.get('Content-Type')).toBeNull()
	})

	it('should return response on requests OPTIONS', async () => {
		const handlerWithAllowMethods = cors({
			origin: 'http://localhost:3000',
		})

		const context = new Context(optionsRequest)

		await handlerWithAllowMethods(context)

		expect(context.res.status).toBe(204)
		expect(context.res.statusText).toBe('OK')
	})
})
