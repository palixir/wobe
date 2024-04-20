import { createServer } from 'node:http'
import type { RadixTree } from '../../router'
import type { HttpMethod, WobeOptions } from '../../Wobe'
import { HttpException } from '../../HttpException'
import { Context } from '../../Context'
import type { RuntimeAdapter } from '..'
import type { CommonRuntime } from '../common'

const transformResponseInstanceToValidResponse = async (response: Response) => {
	const headers: Record<string, string> = {}
	response.headers.forEach((value, name) => {
		headers[name] = value
	})

	if (response.headers.get('content-type') === 'appplication/json')
		return { headers, body: await response.json() }

	return { headers, body: await response.text() }
}

export const NodeAdapter = (commonRuntime: CommonRuntime): RuntimeAdapter => ({
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

				const context = commonRuntime.createContext(request)

				const { route } = commonRuntime.getRoute(
					router,
					url,
					req.method as HttpMethod,
				)

				if (!route) {
					options?.onNotFound?.(request)

					res.writeHead(404)
					res.end()
					return
				}

				context.getIpAdress = () => req.socket.remoteAddress || ''

				try {
					const response = await commonRuntime.executeHandler(route)

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
