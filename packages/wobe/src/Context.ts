import type { HttpMethod, WobeHandler } from './Wobe'
import { WobeResponse } from './WobeResponse'
import type { RadixTree } from './router'
import { extractPathnameAndSearchParams } from './utils'

export class Context {
	public res: WobeResponse
	public request: Request
	public params: Record<string, string> = {}
	public pathname = ''
	public query: Record<string, string> = {}

	public state: 'beforeHandler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined
	public getIpAdress: () => string = () => ''

	public handler: WobeHandler | undefined = undefined
	public beforeHandlerHook: Array<WobeHandler> = []
	public afterHandlerHook: Array<WobeHandler> = []

	constructor(request: Request, router?: RadixTree) {
		this.request = request
		this.res = new WobeResponse(request)

		this._findRoute(router)
	}

	private _findRoute(router?: RadixTree) {
		const { pathName, searchParams } = extractPathnameAndSearchParams(
			this.request.url,
		)

		const route = router?.findRoute(
			this.request.method as HttpMethod,
			pathName,
		)

		this.query = searchParams || {}
		this.pathname = pathName
		this.params = route?.params || {}
		this.handler = route?.handler
		this.beforeHandlerHook = route?.beforeHandlerHook || []
		this.afterHandlerHook = route?.afterHandlerHook || []
	}

	redirect(url: string, status = 302) {
		this.res.headers.set('Location', url)
		this.res.status = status
	}

	async executeHandler() {
		// We need to run hook sequentially
		for (const hookBeforeHandler of this.beforeHandlerHook)
			await hookBeforeHandler(this)

		const resultHandler = await this.handler?.(this)

		if (!this.res.response && resultHandler instanceof Response)
			this.res.response = resultHandler

		this.state = 'afterHandler'

		// We need to run hook sequentially
		let responseAfterHook = undefined
		for (const hookAfterHandler of this.afterHandlerHook)
			responseAfterHook = await hookAfterHandler(this)

		if (responseAfterHook instanceof Response) return responseAfterHook

		return this.res.response || new Response(null, { status: 404 })
	}
}
