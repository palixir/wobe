import { Context } from '../Context'
import { HttpException } from '../HttpException'
import type { HttpMethod, WobeOptions } from '../Wobe'
import type { RadixTree } from '../router'
import { extractPathnameAndSearchParams } from '../utils'

export const bunServe = (
	port: number,
	router: RadixTree,
	options?: WobeOptions,
) => {
	return Bun.serve({
		port,
		hostname: options?.hostname,
		development: process.env.NODE_ENV !== 'production',
		async fetch(req) {
			const { pathName, searchParams } =
				extractPathnameAndSearchParams(req)

			const route = router.findRoute(req.method as HttpMethod, pathName)

			if (!route) return new Response(null, { status: 404 })

			const context = new Context(req)

			context.getIpAdress = () => this.requestIP(req)?.address || ''
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

				if (responseAfterMiddleware instanceof Response)
					return responseAfterMiddleware

				return (
					context.res.response || new Response(null, { status: 404 })
				)
			} catch (err: any) {
				if (err instanceof Error) options?.onError?.(err)

				if (err instanceof HttpException) return err.response

				return new Response(err.message, {
					status: Number(err.code) || 500,
				})
			}
		},
	})
}
