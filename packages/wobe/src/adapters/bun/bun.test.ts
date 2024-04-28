import { describe, expect, it, beforeEach, spyOn } from 'bun:test'
import getPort from 'get-port'
import { Wobe } from '../../Wobe'

describe.skipIf(process.env.NODE_TEST === 'true')('Bun server', () => {
	const spyBunServer = spyOn(global.Bun, 'serve')

	beforeEach(() => {
		spyBunServer.mockClear()
	})

	it('should call simple bun server without https', async () => {
		const port = await getPort()
		const wobe = new Wobe({ https: undefined })

		wobe.get('/hi', (ctx) => ctx.res.sendText('Hi'))

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/hi`)

		expect(response.status).toBe(200)
		expect(spyBunServer).toHaveBeenCalledTimes(1)
		expect(spyBunServer).toHaveBeenCalledWith({
			port: expect.any(Number),
			tls: {
				key: undefined,
				cert: undefined,
			},
			development: true,
			websocket: expect.anything(),
			fetch: expect.any(Function),
		})

		wobe.stop()
	})

	it('should call create server from node:https if https options is not undefined', async () => {
		const port = await getPort()

		const key = await Bun.file(
			`${import.meta.dirname}/../../../fixtures/key.pem`,
		).text()
		const cert = await Bun.file(
			`${import.meta.dirname}/../../../fixtures/cert.pem`,
		).text()

		const wobe = new Wobe({
			tls: {
				key,
				cert,
				passphrase: 'test',
			},
		})

		wobe.get('/hi', (ctx) => ctx.res.sendText('Hi'))

		wobe.listen(port)

		const response = await fetch(`https://127.0.0.1:${port}/hi`, {})

		expect(response.status).toBe(200)
		expect(response.status).toBe(200)
		expect(spyBunServer).toHaveBeenCalledTimes(1)
		expect(spyBunServer).toHaveBeenCalledWith({
			port: expect.any(Number),
			tls: {
				key,
				cert,
				passphrase: 'test',
			},
			development: true,
			websocket: expect.anything(),
			fetch: expect.any(Function),
		})

		wobe.stop()
	})
})
