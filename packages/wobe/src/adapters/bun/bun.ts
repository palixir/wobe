import type { RuntimeAdapter } from '..'
import { Context } from '../../Context'
import { HttpException } from '../../HttpException'
import type { WobeOptions, WobeWebSocket } from '../../Wobe'
import type { RadixTree } from '../../router'
import { bunWebSocket } from './websocket'

export const BunAdapter = (): RuntimeAdapter => ({
	createServer: (
		port: number,
		router: RadixTree,
		options?: WobeOptions,
		webSocket?: WobeWebSocket,
	) =>
		Bun.serve({
			port,
			tls: options?.tls,
			hostname: options?.hostname,
			development: process.env.NODE_ENV !== 'production',
			websocket: bunWebSocket(webSocket),
			async fetch(req, server) {
				try {
					const context = new Context(req, router)

					context.getIpAdress = () =>
						this.requestIP(req)?.address || ''

					if (webSocket && webSocket.path === context.pathname) {
						// We need to run hook sequentially
						for (const hookBeforeSocketUpgrade of webSocket.beforeWebSocketUpgrade ||
							[])
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
