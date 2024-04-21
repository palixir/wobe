import type { HttpMethod, WobeHandler } from './Wobe'
import { WobeResponse } from './WobeResponse'
import type { Node, RadixTree } from './router'
import { WobeStore } from './store'
import { extractPathnameAndSearchParams } from './utils'

// 10 seconds
export const _routeStore = new WobeStore<{
	pathName: string
	searchParams: Record<string, string> | undefined
	route: Node | undefined | null
}>({ interval: 10000 })

export class Context {
	public res: WobeResponse
	public request: Request
	public params: Record<string, string> = {}
	public pathname = ''
	public query: Record<string, string> = {}

	public ipAdress: string | undefined = undefined
	public state: 'beforeHandler' | 'handler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined
	public body: string | object = {}
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
		const keyCacheName = `${this.request.url}$method:${this.request.method}`

		const cache = _routeStore.get(keyCacheName)
		let pathName, searchParams, route

		if (cache) {
			pathName = cache.pathName
			searchParams = cache.searchParams
			route = cache.route
		} else {
			const extractedInfos = extractPathnameAndSearchParams(
				this.request.url,
			)

			pathName = extractedInfos.pathName
			searchParams = extractedInfos.searchParams

			route = router?.findRoute(
				this.request.method as HttpMethod,
				pathName,
			)

			_routeStore.set(keyCacheName, {
				route,
				searchParams,
				pathName,
			})
		}

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
		const hookBeforeHandler = this.beforeHandlerHook

		// We need to run hook sequentially
		for (let i = 0; i < hookBeforeHandler.length; i++) {
			const hook = hookBeforeHandler[i]

			await hook(this)
		}

		this.state = 'handler'

		const resultHandler = await this.handler?.(this)

		if (!this.res.response && resultHandler instanceof Response)
			this.res.response = resultHandler

		this.state = 'afterHandler'

		const hookAfterHandler = this.afterHandlerHook

		// We need to run hook sequentially
		let responseAfterHook = undefined
		for (let i = 0; i < hookAfterHandler.length; i++) {
			const hook = hookAfterHandler[i]

			responseAfterHook = await hook(this)
		}

		const response =
			responseAfterHook instanceof Response
				? responseAfterHook
				: this.res.response || new Response(null, { status: 404 })

		return response
	}
}
