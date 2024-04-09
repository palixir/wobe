import { describe, expect, it } from 'bun:test'
import { WobeResponse } from '../WobeResponse'
import { secureHeaders } from './secureHeaders'
import { Context } from '../context'

describe('Secure headers', () => {
	it('should set Content-Security-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			contentSecurityPolicy: {
				'default-src': ["'self'"],
				'report-to': 'endpoint-5',
			},
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Content-Security-Policy')).toEqual(
			"default-src 'self'; report-to endpoint-5",
		)
	})

	it('should set Cross-Origin-Embedder-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			crossOriginEmbedderPolicy: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Cross-Origin-Embedder-Policy')).toEqual(
			'random-value',
		)
	})

	it('should have a default value for Cross-Origin-Opener-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Cross-Origin-Opener-Policy')).toEqual(
			'same-origin',
		)
	})

	it('should set Cross-Origin-Opener-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			crossOriginOpenerPolicy: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Cross-Origin-Opener-Policy')).toEqual(
			'random-value',
		)
	})

	it('should have default value for Cross-Origin-Resource-Policty', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Cross-Origin-Resource-Policy')).toEqual(
			'same-site',
		)
	})

	it('should set Cross-Origin-Resource-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			crossOriginResourcePolicy: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Cross-Origin-Resource-Policy')).toEqual(
			'random-value',
		)
	})

	it('should have default value for Referer-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Referrer-Policy')).toEqual(
			'no-referrer',
		)
	})

	it('should set Referrer-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			referrerPolicy: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Referrer-Policy')).toEqual(
			'random-value',
		)
	})

	it('should have default value for Strict-Transport-Security', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Strict-Transport-Security')).toEqual(
			'max-age=31536000; includeSubDomains',
		)
	})

	it('should set Strict-Transport-Security', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			strictTransportSecurity: ['random-value1', 'random-value2'],
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('Strict-Transport-Security')).toEqual(
			'random-value1; random-value2',
		)
	})

	it('should have default value for X-Content-Type-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('X-Content-Type-Options')).toEqual(
			'nosniff',
		)
	})

	it('should set X-Content-Type-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			xContentTypeOptions: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('X-Content-Type-Options')).toEqual(
			'random-value',
		)
	})

	it('should have default value for X-Download-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('X-Download-Options')).toEqual('noopen')
	})

	it('should set X-Download-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = secureHeaders({
			xDownloadOptions: 'random-value',
		})

		const context = new Context(request)
		context.ipAdress = 'ipAdress'

		handler(context)

		expect(context.res.headers.get('X-Download-Options')).toEqual(
			'random-value',
		)
	})
})
