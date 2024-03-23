import { describe, expect, it } from 'bun:test'
import { WobeResponse } from '../WobeResponse'
import { bodyLimit } from './bodyLimit'

describe('bodyLimit', () => {
	const invalidRequest = new Request('http://localhost:3000/test', {
		headers: {
			'Content-Length': '1000', // 1000 bytes
		},
	})

	const validRequest = new Request('http://localhost:3000/test', {
		headers: {
			'Content-Length': '400', // 400 bytes
		},
	})

	it('should not throw an error if the body is not too large', async () => {
		const wobeResponse = new WobeResponse(validRequest)

		const handler = bodyLimit({
			maxSize: 500, // 500 bytes
		})

		expect(() =>
			handler({ request: validRequest }, wobeResponse),
		).not.toThrow()
	})

	it('should throw an error if the body is too large', async () => {
		const wobeResponse = new WobeResponse(invalidRequest)

		const handler = bodyLimit({
			maxSize: 500, // 500 bytes
		})

		expect(() =>
			handler({ request: invalidRequest }, wobeResponse),
		).toThrow()
	})
})
