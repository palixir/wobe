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
})
