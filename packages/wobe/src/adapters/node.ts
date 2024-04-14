import { createServer } from 'node:http'
import type { RadixTree } from '../router'
import type { HttpMethod, WobeOptions } from '../Wobe'
import { HttpException } from '../HttpException'
import { extractPathnameAndSearchParams } from '../utils'
import { Context } from '../Context'
import type { RuntimeAdapter } from '.'

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
	createServer: (port: number, router: RadixTree, options?: WobeOptions) => {
		console.log('NodeAdapter')
		return createServer(async (req, res) => {
			const url = `http://${req.headers.host}${req.url}`

			const body: Array<any> = []
			req.on('data', (chunk) => {
				body.push(chunk)
			})

			req.on('end', async () => {
				const { pathName, searchParams } =
					extractPathnameAndSearchParams(url)

				const route = router.findRoute(
					req.method as HttpMethod,
					pathName,
				)

				if (!route) {
					res.writeHead(404)
					res.end()
					return
				}

				const request = new Request(url, {
					method: req.method,
					headers: req.headers as any,
					body,
				})

				const context = new Context(request)

				context.getIpAdress = () => req.socket.remoteAddress || ''
				context.params = route.params || {}
				context.query = searchParams || {}

				try {
					const middlewareBeforeHandler =
						route.beforeHandlerMiddleware || []

					// We need to run middleware sequentially
					for (let i = 0; i < middlewareBeforeHandler.length; i++) {
						const middleware = middlewareBeforeHandler[i]

						await middleware(context)
					}

					context.state = 'handler'

					const resultHandler = await route.handler?.(context)

					if (
						!context.res.response &&
						resultHandler instanceof Response
					)
						context.res.response = resultHandler

					context.state = 'afterHandler'

					const middlewareAfterHandler =
						route.afterHandlerMiddleware || []

					// We need to run middleware sequentially
					let responseAfterMiddleware = undefined
					for (let i = 0; i < middlewareAfterHandler.length; i++) {
						const middleware = middlewareAfterHandler[i]

						responseAfterMiddleware = await middleware(context)
					}

					const response =
						responseAfterMiddleware instanceof Response
							? responseAfterMiddleware
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
		}).listen(port)
	},
	stopServer: (server: any) => server.close(),
})
