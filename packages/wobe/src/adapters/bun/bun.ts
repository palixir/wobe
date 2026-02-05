import type { RuntimeAdapter } from '..'
import { Context } from '../../Context'
import { HttpException } from '../../HttpException'
import type { WobeOptions, WobeWebSocket } from '../../Wobe'
import type { Router } from '../../router'
import { bunWebSocket } from './websocket'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024 // 1 MiB

const normalizeEncodings = (encodings?: string[]) =>
	(encodings || ['identity', '']).map((e) => e.toLowerCase())

const isHostHeaderValid = (host?: string | null) => {
	if (!host) return false
	if (host.includes(',')) return false
	return /^[A-Za-z0-9.-]+(:\d+)?$/.test(host.trim())
}

const parseForwardedIp = (xff?: string | null) => {
	if (!xff) return undefined
	const first = xff.split(',')[0]?.trim()
	return first && first.length <= 100 ? first : undefined
}

const decompressBody = (encoding: string, buffer: Uint8Array, maxBodySize: number) => {
	const lower = encoding.toLowerCase()
	if (lower === 'identity' || lower === '') return Buffer.from(buffer)

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

	return decompressed
}

export const BunAdapter = (): RuntimeAdapter => ({
	createServer: (port: number, router: Router, options?: WobeOptions, webSocket?: WobeWebSocket) =>
		Bun.serve({
			port,
			tls: options?.tls,
			hostname: options?.hostname,
			development: process.env.NODE_ENV !== 'production',
			websocket: bunWebSocket(webSocket),
			async fetch(req, server) {
				const maxBodySize = options?.maxBodySize ?? DEFAULT_MAX_BODY_SIZE
				const allowedContentEncodings = normalizeEncodings(options?.allowedContentEncodings)

				const hostHeader = req.headers.get('host')
				if (!isHostHeaderValid(hostHeader)) return new Response(null, { status: 400 })

				const expectHeader = req.headers.get('expect')
				if (expectHeader) return new Response(null, { status: 417 })

				try {
					const contentEncoding = req.headers.get('content-encoding')?.toLowerCase() || 'identity'

					if (!allowedContentEncodings.includes(contentEncoding))
						return new Response('Unsupported Content-Encoding', {
							status: 415,
						})

					// Validate declared content-length before reading
					const contentLengthHeader = req.headers.get('content-length') || '0'
					const parsedLength = Number(contentLengthHeader)

					if (!Number.isNaN(parsedLength) && parsedLength > maxBodySize)
						return new Response(null, { status: 413 })

					let requestForContext = req

					if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
						const rawBody = new Uint8Array(await req.arrayBuffer())

						if (rawBody.byteLength > maxBodySize) return new Response(null, { status: 413 })

						let decodedBody: Buffer
						try {
							decodedBody = decompressBody(contentEncoding, rawBody, maxBodySize)
						} catch (err: any) {
							if (err?.message === 'UNSUPPORTED_ENCODING')
								return new Response('Unsupported Content-Encoding', { status: 415 })
							if (err?.message === 'PAYLOAD_TOO_LARGE') return new Response(null, { status: 413 })

							return new Response('Invalid compressed body', {
								status: 400,
							})
						}

						requestForContext = new Request(req.url, {
							method: req.method,
							headers: req.headers,
							body: decodedBody,
						})
					}

					const context = new Context(requestForContext, router)

					context.getIpAdress = () => {
						if (options?.trustProxy) {
							const forwarded = parseForwardedIp(req.headers.get('x-forwarded-for'))
							if (forwarded) return forwarded
						}

						return this.requestIP(req)?.address || ''
					}

					if (webSocket && webSocket.path === context.pathname) {
						// We need to run hook sequentially
						for (const hookBeforeSocketUpgrade of webSocket.beforeWebSocketUpgrade || [])
							await hookBeforeSocketUpgrade(context)

						if (server.upgrade(req)) return
					}

					if (!context.handler) {
						options?.onNotFound?.(req)

						return new Response(null, { status: 404 })
					}

					// Need to await before turn to catch potential error
					return await context.executeHandler()
				} catch (err: any) {
					if (err instanceof Error) options?.onError?.(err)

					if (err instanceof HttpException) return err.response

					return new Response(err.message, {
						status: Number(err.code) || 500,
					})
				}
			},
		}),
	stopServer: async (server) => server.stop(),
})
