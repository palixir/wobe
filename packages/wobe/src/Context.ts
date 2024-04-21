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

		const { pathName, searchParams } = extractPathnameAndSearchParams(
			request.url,
		)

		const route = router?.findRoute(request.method as HttpMethod, pathName)

		this.pathname = pathName
		this.query = searchParams || {}
		this.params = route?.params || {}
		this.handler = route?.handler
		this.beforeHandlerHook = route?.beforeHandlerHook || []
		this.afterHandlerHook = route?.afterHandlerHook || []
	}

	redirect(url: string, status = 302) {
		this.res.headers.set('Location', url)
		this.res.status = status
	}
}
