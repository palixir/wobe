import type { Hook, HttpMethod, WobeHandler } from '../Wobe'
export * from './RadixTree'
export * from './UrlPatternRouter'

export interface Node {
	name: string
	children: Array<Node>
	handler?: WobeHandler<any>
	beforeHandlerHook?: Array<WobeHandler<any>>
	afterHandlerHook?: Array<WobeHandler<any>>
	method?: HttpMethod
	isParameterNode?: boolean
	isWildcardNode?: boolean
	params?: Record<string, string>
}

export interface Router {
	root: Node
	addRoute(method: HttpMethod, path: string, handler: WobeHandler<any>): void
	addHook(
		hook: Hook,
		path: string,
		handler: WobeHandler<any>,
		method: HttpMethod,
		node?: Node,
	): void
	findRoute(method: HttpMethod, path: string): Node | null
	optimizeTree(): void
}
