import { Context } from '../Context'
import type { HttpMethod } from '../Wobe'
import type { Node, RadixTree } from '../router'
import { extractPathnameAndSearchParams } from '../utils'

export class CommonRuntime {
	private context: Context | undefined = undefined

	createContext(request: Request, router: RadixTree) {
		this.context = new Context(request, router)

		return this.context
	}

	// createContext(request: Request) {
	// 	this.context = new Context(request)

	// 	return this.context
	// }

	// findRoute(router: RadixTree, url: string, requestMethod: HttpMethod) {
	// 	if (!this.context)
	// 		throw new Error(
	// 			'You need to initialize context before execute handler',
	// 		)

	// 	const { pathName, searchParams } = extractPathnameAndSearchParams(url)

	// 	const route = router.findRoute(requestMethod, pathName)

	// 	this.context.query = searchParams || {}
	// 	this.context.params = route?.params || {}

	// 	return { route, pathName }
	// }

	async executeHandler() {
		if (!this.context)
			throw new Error(
				'You need to initialize context before execute handler',
			)

		const hookBeforeHandler = this.context.beforeHandlerHook

		// We need to run hook sequentially
		for (let i = 0; i < hookBeforeHandler.length; i++) {
			const hook = hookBeforeHandler[i]

			await hook(this.context)
		}

		this.context.state = 'handler'

		const resultHandler = await this.context.handler?.(this.context)

		if (!this.context.res.response && resultHandler instanceof Response)
			this.context.res.response = resultHandler

		this.context.state = 'afterHandler'

		const hookAfterHandler = this.context.afterHandlerHook

		// We need to run hook sequentially
		let responseAfterHook = undefined
		for (let i = 0; i < hookAfterHandler.length; i++) {
			const hook = hookAfterHandler[i]

			responseAfterHook = await hook(this.context)
		}

		const response =
			responseAfterHook instanceof Response
				? responseAfterHook
				: this.context.res.response ||
					new Response(null, { status: 404 })

		return response
	}
}
