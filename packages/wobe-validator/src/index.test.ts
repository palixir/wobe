import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { Type as T } from '@sinclair/typebox'
import { Wobe } from 'wobe'
import getPort from 'get-port'
import { wobeValidator } from '.'

const schema = T.Object({
	name: T.String(),
})

describe('wobe-validator', () => {
	let port: number
	let wobe: Wobe

	beforeAll(async () => {
		port = await getPort()
		wobe = new Wobe()

		wobe.post(
			'/test',
			(ctx) => {
				return ctx.res.send('ok')
			},
			wobeValidator(schema),
		)

		wobe.listen(port)
	})

	afterAll(() => {
		wobe.stop()
	})

	it('should return 200 for a valid request body', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/test`, {
			method: 'POST',
			body: JSON.stringify({ name: 'testName' }),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('ok')
	})

	it('should return 400 for an invalid request body', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/test`, {
			method: 'POST',
			body: JSON.stringify({ name: 42 }),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			errors: [
				{
					message: 'Expected string',
					path: '/name',
					schema: {
						type: 'string',
					},
					type: 54,
					value: 42,
				},
			],
		})
	})

	it('should return 400 for a request if content-type not equal to application/json', async () => {
		const response = await fetch(`http://127.0.0.1:${port}/test`, {
			method: 'POST',
			body: JSON.stringify({ name: 42 }),
			headers: {
				'Content-Type': 'invalid/application/json',
			},
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toBeNull()
	})
})
