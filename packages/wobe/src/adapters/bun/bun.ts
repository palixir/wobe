import type { RuntimeAdapter } from '..'
import { Context } from '../../Context'
import { HttpException } from '../../HttpException'
import type { HttpMethod, WobeOptions, WobeWebSocket } from '../../Wobe'
import type { RadixTree } from '../../router'
import { extractPathnameAndSearchParams } from '../../utils'
import { bunWebSocket } from './websocket'

export const BunAdapter = (): RuntimeAdapter => ({
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
					const context = new Context(req)

					const { pathName, searchParams } =
						extractPathnameAndSearchParams(req.url)

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

					const route = router.findRoute(
						req.method as HttpMethod,
						pathName,
					)

					if (!route) {
						options?.onNotFound?.(req)

						return new Response(null, { status: 404 })
					}

					context.getIpAdress = () =>
						this.requestIP(req)?.address || ''
					context.params = route.params || {}
					context.query = searchParams || {}

					const hookBeforeHandler = route.beforeHandlerHook || []

					// We need to run hook sequentially
					for (let i = 0; i < hookBeforeHandler.length; i++) {
						const hook = hookBeforeHandler[i]

						await hook(context)
					}

					context.state = 'handler'

					const resultHandler = await route.handler?.(context)

					if (
						!context.res.response &&
						resultHandler instanceof Response
					)
						context.res.response = resultHandler

					context.state = 'afterHandler'

					const hookAfterHandler = route.afterHandlerHook || []

					// We need to run hook sequentially
					let responseAfterHook = undefined
					for (let i = 0; i < hookAfterHandler.length; i++) {
						const hook = hookAfterHandler[i]

						responseAfterHook = await hook(context)
					}

					if (responseAfterHook instanceof Response)
						return responseAfterHook

					return (
						context.res.response ||
						new Response(null, { status: 404 })
					)
				} catch (err: any) {
					console.log(err)
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
