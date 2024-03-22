import { describe, expect, it } from 'bun:test'
import { csrf } from './csrf'
import { WobeResponse } from '../WobeResponse'
import { HttpException } from '../HttpException'

describe('Csrf middleware', () => {
	it('should not block requests with a valid origin (string)', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({ origin: 'http://localhost:3000' })

		expect(() => handler(request, wobeResponse)).not.toThrow()
	})

	it('should not block requests with a valid origin (array)', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({
			origin: ['http://localhost:3001', 'http://localhost:3000'],
		})

		expect(() => handler(request, wobeResponse)).not.toThrow(
			'CSRF: Invalid origin',
		)
	})

	it('should not block requests with a valid origin (function)', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3000',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({
			origin: (origin) => origin === 'http://localhost:3000',
		})

		expect(() => handler(request, wobeResponse)).not.toThrow()
	})

	it('should block requests with an invalid origin (string)', async () => {
		const request = new Request('http://localhost:3000/test', {})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({ origin: 'http://localhost:3000' })

		expect(() => handler(request, wobeResponse)).toThrow()
	})

	it('should block requests with an invalid origin (array)', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3001',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({
			origin: ['http://localhost:3000', 'http://localhost:3002'],
		})

		expect(() => handler(request, wobeResponse)).toThrow()
	})

	it('should block requests with an invalid origin (function)', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				origin: 'http://localhost:3001',
			},
		})
		const wobeResponse = new WobeResponse(request)

		const handler = csrf({
			origin: (origin) => origin === 'http://localhost:3000',
		})

		expect(() => handler(request, wobeResponse)).toThrow()
	})
})
