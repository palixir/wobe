import { describe, expect, it } from 'bun:test'
import { WobeResponse } from '../WobeResponse'
import { secureHeaders } from './secureHeaders'

describe('Secure headers', () => {
	it('should set Content-Security-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			contentSecurityPolicy: {
				'default-src': ["'self'"],
				'report-to': 'endpoint-5',
			},
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Content-Security-Policy')).toEqual(
			"default-src 'self'; report-to endpoint-5",
		)
	})

	it('should set Cross-Origin-Embedder-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			crossOriginEmbedderPolicy: 'require-corp',
		})

		handler(request, wobeResponse)

		expect(
			wobeResponse.headers.get('Cross-Origin-Embedder-Policy'),
		).toEqual('require-corp')
	})

	it('should have a default value for Cross-Origin-Opener-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Cross-Origin-Opener-Policy')).toEqual(
			'same-origin',
		)
	})

	it('should set Cross-Origin-Opener-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			crossOriginOpenerPolicy: 'same-origin',
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Cross-Origin-Opener-Policy')).toEqual(
			'same-origin',
		)
	})

	it('should have default value for Cross-Origin-Resource-Policty', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(
			wobeResponse.headers.get('Cross-Origin-Resource-Policy'),
		).toEqual('same-site')
	})

	it('should set Cross-Origin-Resource-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			crossOriginResourcePolicy: 'same-site',
		})

		handler(request, wobeResponse)

		expect(
			wobeResponse.headers.get('Cross-Origin-Resource-Policy'),
		).toEqual('same-site')
	})

	it('should have default value for Referer-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Referrer-Policy')).toEqual(
			'no-referrer',
		)
	})

	it('should set Referrer-Policy', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			referrerPolicy: 'no-referrer',
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Referrer-Policy')).toEqual(
			'no-referrer',
		)
	})

	it('should have default value for Strict-Transport-Security', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Strict-Transport-Security')).toEqual(
			'max-age=31536000; includeSubDomains',
		)
	})

	it('should set Strict-Transport-Security', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			strictTransportSecurity: 'max-age=31536000; includeSubDomains',
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('Strict-Transport-Security')).toEqual(
			'max-age=31536000; includeSubDomains',
		)
	})

	it('should have default value for X-Content-Type-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('X-Content-Type-Options')).toEqual(
			'nosniff',
		)
	})

	it('should set X-Content-Type-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			xContentTypeOptions: 'nosniff',
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('X-Content-Type-Options')).toEqual(
			'nosniff',
		)
	})

	it('should have default value for X-Download-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('X-Download-Options')).toEqual('noopen')
	})

	it('should set X-Download-Options', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = secureHeaders({
			xDownloadOptions: 'noopen',
		})

		handler(request, wobeResponse)

		expect(wobeResponse.headers.get('X-Download-Options')).toEqual('noopen')
	})
})
