import { describe, expect, it, spyOn, beforeEach } from 'bun:test'
import * as nodeHttp from 'node:http'
import * as nodeHttps from 'node:https'
import { Wobe } from '../../Wobe'
import getPort from 'get-port'
import { HttpException } from '../../HttpException'

describe.skipIf(process.env.NODE_TEST !== 'true')('Node server', () => {
	const spyCreateHttpServer = spyOn(nodeHttp, 'createServer')
	const spyCreateHttpsServer = spyOn(nodeHttps, 'createServer')

	beforeEach(() => {
		spyCreateHttpServer.mockClear()
		spyCreateHttpsServer.mockClear()
	})

	it('should reset the wobe response if context already exist in cache', async () => {
		const port = await getPort()
		const wobe = new Wobe({ tls: undefined })

		wobe.get('/hi', async (ctx) => {
			if (ctx.res.status === 201) {
				throw new HttpException(
					new Response('Status should be equal to 200'),
				)
			}

			ctx.res.sendText('Hi')
			ctx.res.status = 201
		})

		wobe.listen(port)

		await fetch(`http://127.0.0.1:${port}/hi`)

		const res = await fetch(`http://127.0.0.1:${port}/hi`)

		expect(await res.text()).not.toEqual('Status should be equal to 200')

		wobe.stop()
	})

	it('should call create server from node:http if https options is undefined', async () => {
		const port = await getPort()
		const wobe = new Wobe({ tls: undefined })

		wobe.get('/hi', (ctx) => ctx.res.sendText('Hi'))

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/hi`)

		expect(response.status).toBe(200)
		expect(spyCreateHttpServer).toHaveBeenCalledTimes(1)
		expect(spyCreateHttpsServer).toHaveBeenCalledTimes(0)

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
		expect(spyCreateHttpServer).toHaveBeenCalledTimes(0)
		expect(spyCreateHttpsServer).toHaveBeenCalledTimes(1)
		expect(spyCreateHttpsServer).toHaveBeenCalledWith(
			{ key, cert, passphrase: 'test' },
			expect.any(Function),
		)

		wobe.stop()
	})
})
