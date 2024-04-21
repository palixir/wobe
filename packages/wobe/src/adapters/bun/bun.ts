import type { RuntimeAdapter } from '..'
import { HttpException } from '../../HttpException'
import type { HttpMethod, WobeOptions, WobeWebSocket } from '../../Wobe'
import type { RadixTree } from '../../router'
import type { CommonRuntime } from '../common'
import { bunWebSocket } from './websocket'

export const BunAdapter = (commonRuntime: CommonRuntime): RuntimeAdapter => ({
	createServer: (
		port: number,
		router: RadixTree,
		options?: WobeOptions,
		webSocket?: WobeWebSocket,
	) => {
		return Bun.serve({
			port,
			hostname: options?.hostname,
			development: process.env.NODE_ENV !== 'production',
			websocket: bunWebSocket(webSocket),
			async fetch(req, server) {
				try {
					const context = commonRuntime.createContext(req)

					const { route, pathName } = commonRuntime.getRoute(
						router,
						req.url,
						req.method as HttpMethod,
					)

					if (webSocket && webSocket.path === pathName) {
						const hookBeforeSocketUpgrade =
							webSocket.beforeWebSocketUpgrade || []

						// We need to run hook sequentially
						for (
							let i = 0;
							i < hookBeforeSocketUpgrade.length;
							i++
						) {
							const hook = hookBeforeSocketUpgrade[i]

							await hook(context)
						}

						if (server.upgrade(req)) return
					}

					if (!route) {
						options?.onNotFound?.(req)

						return new Response(null, { status: 404 })
					}

					context.getIpAdress = () =>
						this.requestIP(req)?.address || ''

					const response = await commonRuntime.executeHandler(route)

					return response
				} catch (err: any) {
					if (err instanceof Error) options?.onError?.(err)

					if (err instanceof HttpException) return err.response

					return new Response(err.message, {
						status: Number(err.code) || 500,
					})
				}
			},
		})
	},
	stopServer: async (server) => server.stop(),
})
