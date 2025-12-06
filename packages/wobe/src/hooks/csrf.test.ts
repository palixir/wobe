import { describe, expect, it } from 'bun:test'
import { csrf } from './csrf'
import { Context } from '../Context'

describe('Csrf hook', () => {
	it('should not block requests with a valid origin (string)', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = csrf({ origin: 'http://localhost:3000' })

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).not.toThrow()
	})

	it('should not block requests with a valid origin (array)', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = csrf({
			origin: ['http://localhost:3001', 'http://localhost:3000'],
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).not.toThrow('CSRF: Invalid origin')
	})

	it('should not block requests with a valid origin (function)', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:3000',
			},
		})

		const handler = csrf({
			origin: (origin) => origin === 'http://localhost:3000',
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).not.toThrow()
	})

	it('should block requests with an invalid origin (string)', async () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
		})

		const handler = csrf({ origin: 'http://localhost:3000' })

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).toThrow()
	})

	it('should block requests with an invalid origin (array)', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:3001',
			},
		})

		const handler = csrf({
			origin: ['http://localhost:3000', 'http://localhost:3002'],
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).toThrow()
	})

	it('should block requests with an invalid origin (function)', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:3001',
			},
		})

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		const handler = csrf({
			origin: (origin) => origin === 'http://localhost:3000',
		})

		expect(() => handler(context)).toThrow()
	})

	it('should allow requests with valid referer when origin is missing', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				referer: 'http://localhost:3000/form',
			},
		})

		const handler = csrf({ origin: 'http://localhost:3000' })
		const context = new Context(request)

		expect(() => handler(context)).not.toThrow()
	})

	it('should block requests with cross-site referer when origin is missing', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'POST',
			headers: {
				referer: 'http://evil.com/attack',
			},
		})

		const handler = csrf({ origin: 'http://localhost:3000' })
		const context = new Context(request)

		expect(() => handler(context)).toThrow()
	})

	it('should ignore CSRF check for safe methods', () => {
		const request = new Request('http://localhost:3000/test', {
			method: 'GET',
		})

		const handler = csrf({ origin: 'http://localhost:3000' })
		const context = new Context(request)

		expect(() => handler(context)).not.toThrow()
	})
})
