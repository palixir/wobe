import { createServer } from 'node:http'
import type { RadixTree } from '../../router'
import type { HttpMethod, WobeOptions } from '../../Wobe'
import { HttpException } from '../../HttpException'
import { extractPathnameAndSearchParams } from '../../utils'
import { Context } from '../../Context'
import type { RuntimeAdapter } from '..'

const transformResponseInstanceToValidResponse = async (response: Response) => {
	const headers: Record<string, string> = {}
	response.headers.forEach((value, name) => {
		headers[name] = value
	})

	if (response.headers.get('content-type') === 'appplication/json')
		return { headers, body: await response.json() }

	return { headers, body: await response.text() }
}

export const NodeAdapter = (): RuntimeAdapter => ({
	createServer: (port: number, router: RadixTree, options?: WobeOptions) =>
		createServer(async (req, res) => {
			const url = `http://${req.headers.host}${req.url}`

			const body: Array<any> = []
			req.on('data', (chunk) => {
				body.push(chunk)
			})

			req.on('end', async () => {
				const request = new Request(url, {
					method: req.method,
					headers: req.headers as any,
					body,
				})

				const { pathName, searchParams } =
					extractPathnameAndSearchParams(url)

				const route = router.findRoute(
					req.method as HttpMethod,
					pathName,
				)

				if (!route) {
					options?.onNotFound?.(request)

					res.writeHead(404)
					res.end()
					return
				}

				const context = new Context(request)

				await context.extractBody()
				context.getIpAdress = () => req.socket.remoteAddress || ''
				context.params = route.params || {}
				context.query = searchParams || {}

				try {
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

					const response =
						responseAfterHook instanceof Response
							? responseAfterHook
							: context.res.response ||
								new Response(null, { status: 404 })

					const { headers, body: responseBody } =
						await transformResponseInstanceToValidResponse(response)

					res.writeHead(
						response.status || 404,
						response.statusText,
						headers,
					)

					res.write(responseBody)
				} catch (err: any) {
					if (err instanceof Error) options?.onError?.(err)

					if (!(err instanceof HttpException)) {
						res.writeHead(Number(err.code) || 500)
						res.write(err.message)

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
		}).listen(port),
	stopServer: (server: any) => server.close(),
})
