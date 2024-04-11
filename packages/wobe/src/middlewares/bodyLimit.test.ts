import { describe, expect, it } from 'bun:test'
import { bodyLimit } from './bodyLimit'
import { Context } from '../Context'

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
		const handler = bodyLimit({
			maxSize: 500, // 500 bytes
		})

		const context = new Context(validRequest)

		expect(() => handler(context)).not.toThrow()
	})

	it('should throw an error if the body is too large', async () => {
		const handler = bodyLimit({
			maxSize: 500, // 500 bytes
		})

		const context = new Context(invalidRequest)

		expect(() => handler(context)).toThrow()
	})
})
