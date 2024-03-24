import { describe, expect, it } from 'bun:test'
import { bearerAuth } from './bearerAuth'
import { WobeResponse } from '../WobeResponse'

describe('BearerAuth', () => {
	it('should authorize the request if the token is valid', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer 123',
			},
		})

		const handler = bearerAuth({
			token: '123',
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).not.toThrow()
	})

	it('should authorize the request if there is not space between prefix and token', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer123',
			},
		})

		const handler = bearerAuth({
			token: '123',
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).not.toThrow()
	})

	it('should authorize the request if there is a custom hash function', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer 123',
			},
		})

		const handler = bearerAuth({
			token: '123',
			// Fake hash function
			hashFunction: (token) => token,
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).not.toThrow()
	})

	it('should not authorize the request if the token is invalid', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'Bearer invalid token',
			},
		})

		const handler = bearerAuth({
			token: '123',
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).toThrow()
	})

	it('should not authorize the request if the authorization is missing', () => {
		const request = new Request('http://localhost:3000/test', {})

		const handler = bearerAuth({
			token: '123',
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).toThrow()
	})

	it('should not authorize the request if the prefix is bad', () => {
		const request = new Request('http://localhost:3000/test', {
			headers: {
				Authorization: 'InvalidPrefix invalid token',
			},
		})

		const handler = bearerAuth({
			token: '123',
		})

		expect(() =>
			handler(
				{ request, ipAdress: 'ipAdress' },
				new WobeResponse(request),
			),
		).toThrow()
	})
})
