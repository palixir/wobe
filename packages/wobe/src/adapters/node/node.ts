import { createServer } from 'node:http'
import { HttpException } from '../../HttpException'
import { Context } from '../../Context'
import { WobeStore } from '../../tools'
import type { RuntimeAdapter } from '..'
import type { RadixTree } from '../../router'
import type { WobeOptions } from '../../Wobe'

const transformResponseInstanceToValidResponse = async (response: Response) => {
	const headers: Record<string, string> = {}

	response.headers.forEach((value, name) => {
		headers[name] = value
	})

	if (response.headers.get('content-type') === 'appplication/json')
		return { headers, body: await response.json() }

	return { headers, body: await response.text() }
}

const _contextStore = new WobeStore<Context>({ interval: 10000 })

export const NodeAdapter = (): RuntimeAdapter => ({
	createServer: (port: number, router: RadixTree, options?: WobeOptions) =>
		createServer(async (req, res) => {
			const url = `http://${req.headers.host}${req.url}`

			let body = ''
			req.on('data', (chunk) => {
				body += chunk
			})

			req.on('end', async () => {
				try {
					const cacheKey = url + '$method:' + req.method

					let context = _contextStore.get(cacheKey)

					const request = new Request(url, {
						method: req.method,
						headers: req.headers as any,
						body:
							req.method !== 'GET' && req.method !== 'HEAD'
								? body
								: undefined,
					})

					if (!context) {
						context = new Context(request, router)

						_contextStore.set(cacheKey, context)
					} else {
						context.request = request
					}

					if (!context.handler) {
						options?.onNotFound?.(context.request)

						res.writeHead(404)
						res.end()
						return
					}

					context.getIpAdress = () => req.socket.remoteAddress || ''

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
