import { createServer as createHttpServer } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'
import { HttpException } from '../../HttpException'
import { Context } from '../../Context'
import type { RuntimeAdapter } from '..'
import type { RadixTree } from '../../router'
import type { WobeOptions } from '../../Wobe'

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024 // 1 MiB

const normalizeEncodings = (encodings?: string[]) =>
	(encodings || ['identity', '']).map((e) => e.toLowerCase())

const isHostHeaderValid = (host?: string | string[]) => {
	if (!host || Array.isArray(host)) return false
	if (host.includes(',')) return false
	// Allow hostname with optional port
	return /^[A-Za-z0-9.-]+(:\d+)?$/.test(host.trim())
}

const parseForwardedIp = (xff?: string | string[]) => {
	if (!xff || Array.isArray(xff)) return undefined
	const first = xff.split(',')[0]?.trim()
	return first && first.length <= 100 ? first : undefined
}

const getClientIp = (req: any, trustProxy?: boolean) => {
	if (trustProxy) {
		const forwarded = parseForwardedIp(
			req.headers['x-forwarded-for'] as string,
		)
		if (forwarded) return forwarded
	}

	return req.socket.remoteAddress || ''
}

const decompressBody = (
	encoding: string,
	buffer: Uint8Array,
	maxBodySize: number,
): Uint8Array => {
	const lower = encoding.toLowerCase()
	if (lower === 'identity' || lower === '') return buffer

	let decompressed: Buffer

	switch (lower) {
		case 'gzip':
			decompressed = gunzipSync(buffer)
			break
		case 'deflate':
			decompressed = inflateSync(buffer)
			break
		case 'br':
			decompressed = brotliDecompressSync(buffer)
			break
		default:
			throw new Error('UNSUPPORTED_ENCODING')
	}

	if (decompressed.length > maxBodySize) throw new Error('PAYLOAD_TOO_LARGE')

	return new Uint8Array(decompressed)
}

const transformResponseInstanceToValidResponse = async (response: Response) => {
	const headers: Record<string, string> = {}

	response.headers.forEach((value, name) => {
		headers[name] = value
	})

	const contentType = response.headers.get('content-type')

	if (contentType === 'appplication/json')
		return { headers, body: await response.json() }

	if (contentType === 'text/plain')
		return { headers, body: await response.text() }

	const arrayBuffer = await response.arrayBuffer()
	return { headers, body: Buffer.from(arrayBuffer) }
}

export const NodeAdapter = (): RuntimeAdapter => ({
	createServer: (port: number, router: RadixTree, options?: WobeOptions) => {
		// @ts-expect-error
		const createServer: typeof createHttpsServer = options?.tls
			? createHttpsServer
			: createHttpServer
		const certificateObject = options?.tls || {}
		const maxBodySize = options?.maxBodySize ?? DEFAULT_MAX_BODY_SIZE
		const allowedContentEncodings = normalizeEncodings(
			options?.allowedContentEncodings,
		)

		return createServer(certificateObject, async (req, res) => {
			const url = `http://${req.headers.host}${req.url}`

			// Basic Host and Expect validation to avoid smuggling/ambiguous routing
			if (!isHostHeaderValid(req.headers.host)) {
				res.writeHead(400)
				res.end()
				return
			}

			if (req.headers.expect) {
				res.writeHead(417)
				res.end()
				return
			}

			const contentEncoding =
				(
					req.headers['content-encoding'] as string | undefined
				)?.toLowerCase() || 'identity'

			if (!allowedContentEncodings.includes(contentEncoding)) {
				res.writeHead(415)
				res.end('Unsupported Content-Encoding')
				return
			}

			const chunks: Uint8Array[] = []
			let receivedLength = 0
			req.on('data', (chunk) => {
				if (receivedLength > maxBodySize) return

				receivedLength += chunk.length

				if (receivedLength > maxBodySize) {
					res.writeHead(413)
					res.end()
					req.destroy()
					return
				}

				chunks.push(new Uint8Array(chunk))
			})

			req.on('end', async () => {
				try {
					let bodyBuffer: Uint8Array | undefined

					if (req.method !== 'GET' && req.method !== 'HEAD') {
						const rawBuffer = Buffer.concat(chunks)
						const decompressed = decompressBody(
							contentEncoding,
							new Uint8Array(
								rawBuffer.buffer,
								rawBuffer.byteOffset,
								rawBuffer.byteLength,
							),
							maxBodySize,
						)

						bodyBuffer = decompressed
					}

					const request = new Request(url, {
						method: req.method,
						headers: req.headers as any,
						body: bodyBuffer,
					})

					const context = new Context(request, router)

					if (!context.handler) {
						options?.onNotFound?.(context.request)

						res.writeHead(404)
						res.end()
						return
					}

					context.getIpAdress = () =>
						getClientIp(req, options?.trustProxy) || ''

					const response = await context.executeHandler()

					const { headers, body: responseBody } =
						await transformResponseInstanceToValidResponse(response)

					res.writeHead(
						response.status || 404,
						response.statusText,
						headers,
					)

					res.write(responseBody)
				} catch (err: any) {
					if (err?.message === 'PAYLOAD_TOO_LARGE') {
						res.writeHead(413)
						res.end()
						return
					}

					if (err?.message === 'UNSUPPORTED_ENCODING') {
						res.writeHead(415)
						res.end('Unsupported Content-Encoding')
						return
					}

					// zlib errors on malformed compressed bodies
					if (err?.code === 'Z_DATA_ERROR') {
						res.writeHead(400)
						res.end('Invalid compressed body')
						return
					}

					if (err instanceof Error) options?.onError?.(err)

					if (!(err instanceof HttpException)) {
						const statusCode = Number(err.code) || 500
						const message =
							err instanceof Error
								? err.message
								: 'Internal Server Error'

						res.writeHead(statusCode)
						res.write(message)

						res.end()
						return
					}

					const { headers, body: responseBody } =
						await transformResponseInstanceToValidResponse(
							err.response,
						)

					res.writeHead(
						err.response.status || 500,
						err.response.statusText,
						headers,
					)

					res.write(responseBody)
				}

				res.end()
			})
		}).listen(port, options?.hostname)
	},
	stopServer: (server: any) => server.close(),
})
