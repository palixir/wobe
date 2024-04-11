import { describe, expect, it } from 'bun:test'
import { csrf } from './csrf'
import { Context } from '../Context'

describe('Csrf middleware', () => {
	it('should not block requests with a valid origin (string)', () => {
		const request = new Request('http://localhost:3000/test', {
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
		const request = new Request('http://localhost:3000/test', {})

		const handler = csrf({ origin: 'http://localhost:3000' })

		const context = new Context(request)
		context.getIpAdress = () => 'ipAdress'

		expect(() => handler(context)).toThrow()
	})

	it('should block requests with an invalid origin (array)', () => {
		const request = new Request('http://localhost:3000/test', {
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
})
