import { describe, expect, it, spyOn, beforeEach } from 'bun:test'
import * as nodeHttp from 'node:http'
import * as nodeHttps from 'node:https'
import { Wobe } from '../../Wobe'
import getPort from 'get-port'
import { HttpException } from '../../HttpException'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

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
				throw new HttpException(new Response('Status should be equal to 200'))
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

		const key = await Bun.file(`${import.meta.dirname}/../../../fixtures/key.pem`).text()
		const cert = await Bun.file(`${import.meta.dirname}/../../../fixtures/cert.pem`).text()

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

	it('should serve a binary file correctly', async () => {
		const port = await getPort()
		const wobe = new Wobe({ tls: undefined })

		const uploadDirectory = join(__dirname, '../../../fixtures')
		const fileName = 'avatar.jpg'
		const filePath = join(uploadDirectory, fileName)

		wobe.get('/binary-test', async (ctx) => {
			const fileContent = await readFile(filePath)
			ctx.res.headers.set('Content-Type', 'image/jpeg')
			ctx.res.send(fileContent)
		})

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/binary-test`)

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('image/jpeg')

		const fileContent = await readFile(filePath)
		const responseArrayBuffer = await response.arrayBuffer()
		const respBuffer = Buffer.from(responseArrayBuffer)
		// @ts-expect-error
		expect(Buffer.compare(respBuffer, fileContent)).toBe(0)

		wobe.stop()
	})

	it('should reject payloads above the configured maxBodySize', async () => {
		const port = await getPort()
		const wobe = new Wobe({ maxBodySize: 5 })

		wobe.post('/echo', async (ctx) => {
			const text = await ctx.request.text()
			return ctx.res.sendText(text)
		})

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/echo`, {
			method: 'POST',
			body: '123456',
		})

		expect(response.status).toBe(413)

		wobe.stop()
	})

	it('should accept payloads under maxBodySize', async () => {
		const port = await getPort()
		const wobe = new Wobe({ maxBodySize: 10 })

		wobe.post('/echo', async (ctx) => {
			const text = await ctx.request.text()
			return ctx.res.sendText(text)
		})

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/echo`, {
			method: 'POST',
			body: '1234',
		})

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('1234')

		wobe.stop()
	})

	it('should reject unsupported content-encoding', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.post('/echo', (ctx) => ctx.res.sendText('ok'))

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/echo`, {
			method: 'POST',
			headers: {
				'content-encoding': 'gzip',
			},
			body: 'hello',
		} as any)

		expect(response.status).toBe(415)

		wobe.stop()
	})

	it('should enforce decompressed size limit for gzip payloads', async () => {
		const port = await getPort()
		const wobe = new Wobe({
			maxBodySize: 16,
			allowedContentEncodings: ['gzip'],
		})

		wobe.post('/echo', async (ctx) => {
			const text = await ctx.request.text()
			return ctx.res.sendText(text)
		})

		wobe.listen(port)

		const largeBody = 'x'.repeat(32)
		const gzipped = gzipSync(largeBody)

		const response = await fetch(`http://127.0.0.1:${port}/echo`, {
			method: 'POST',
			headers: {
				'content-encoding': 'gzip',
			},
			body: gzipped,
		} as any)

		expect(response.status).toBe(413)

		wobe.stop()
	})

	it('should use x-forwarded-for when trustProxy is enabled', async () => {
		const port = await getPort()
		const wobe = new Wobe({ trustProxy: true })

		wobe.get('/ip', (ctx) => ctx.res.sendText(ctx.getIpAdress()))

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/ip`, {
			headers: { 'x-forwarded-for': '203.0.113.10' },
		})

		expect(await response.text()).toBe('203.0.113.10')

		wobe.stop()
	})
})
