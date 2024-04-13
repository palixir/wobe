import { createServer } from 'http'
import type { RadixTree } from '../router'
import type { HttpMethod, WobeOptions } from '../Wobe'
import { HttpException } from '../HttpException'
import { extractPathnameAndSearchParams } from '../utils'
import { Context } from '../Context'

const transformResponseInstanceToStringBody = (response: Response) => {
	if (response.headers.get('content-type') === 'appplication/json')
		return response.json()

	return response.text()
}

export const nodeServe = (
	port: number,
	router: RadixTree,
	options?: WobeOptions,
) => {
	return createServer(async (req, res) => {
		const url = new URL(req.url || '', `http://${req.headers.host}`)

		let body = ''

		req.on('data', (chunk: Buffer) => {
			body += chunk.toString()
		})

		req.on('end', async () => {
			const request = new Request(url || '', {
				method: req.method,
				headers: req.headers as any,
				body,
			})

			const { pathName, searchParams } =
				extractPathnameAndSearchParams(request)

			const route = router.findRoute(
				request.method as HttpMethod,
				pathName,
			)

			if (!route) {
				res.writeHead(404)
				res.end()
				return
			}

			const context = new Context(request)

			// context.getIpAdress = () => this.requestIP(req)?.address || ''
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

				if (!context.res.response && resultHandler instanceof Response)
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

				if (responseAfterMiddleware instanceof Response) {
					res.writeHead(
						responseAfterMiddleware.status || 404,
						responseAfterMiddleware.headers as any,
					)
					res.write(
						await transformResponseInstanceToStringBody(
							responseAfterMiddleware,
						),
					)
					res.end()
					return
				}

				const response =
					context.res.response || new Response(null, { status: 404 })

				res.writeHead(response.status || 404, response.headers as any)

				res.write(await transformResponseInstanceToStringBody(response))

				res.end()
			} catch (err: any) {
				if (err instanceof Error) options?.onError?.(err)

				if (err instanceof HttpException) {
					res.writeHead(
						err.response.status || 500,
						err.response.statusText,
						Object.entries(err.response.headers),
					)

					const body = await transformResponseInstanceToStringBody(
						err.response,
					)

					res.write(body)
					res.end()
				}

				res.writeHead(Number(err.code) || 500)

				res.write(err.message)

				res.end()
			}
		})
	}).listen(port)
}
