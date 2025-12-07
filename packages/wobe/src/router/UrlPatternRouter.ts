import type { Node } from '.'
import type { Hook, HttpMethod, WobeHandler } from '../Wobe'

type URLPatternMatch = {
	pathname?: { groups: Record<string, string> }
}

type URLPatternLike = {
	exec(input: { pathname: string } | string): URLPatternMatch | null
	test(input: { pathname: string } | string): boolean
}

type RouteEntry = {
	node: Node
	method: HttpMethod
	pattern: URLPatternLike | null
	normalizedPath: string
}

const createURLPattern = (pathname: string): URLPatternLike | null => {
	const URLPatternConstructor = (globalThis as any).URLPattern as
		| (new (init: {
				pathname: string
		  }) => URLPatternLike)
		| undefined

	if (!URLPatternConstructor) return null

	return new URLPatternConstructor({ pathname })
}

export class UrlPatternRouter {
	public root: Node = { name: '/', children: [] }
	private isOptimized = false
	private routePatterns = new Map<Node, URLPatternLike | null>()
	private hasURLPattern =
		typeof (globalThis as any).URLPattern === 'function' ||
		typeof (globalThis as any).URLPattern === 'object'
	private routes: Array<RouteEntry> = []

	private addRouteEntry(
		node: Node,
		method: HttpMethod,
		normalizedPath: string,
	) {
		const pattern = this.hasURLPattern
			? createURLPattern(normalizedPath)
			: null

		this.routePatterns.set(node, pattern)

		this.routes.push({
			node,
			method,
			pattern,
			normalizedPath,
		})
	}

	private normalizePath(path: string) {
		let normalized = path[0] === '/' ? path : '/' + path

		if (normalized.length > 1 && normalized.endsWith('/'))
			normalized = normalized.replace(/\/+$/, '')

		return normalized === '' ? '/' : normalized
	}

	addRoute(method: HttpMethod, path: string, handler: WobeHandler<any>) {
		const normalizedPath = this.normalizePath(path)
		const pathParts = normalizedPath.split('/').filter(Boolean)

		let currentNode = this.root

		for (let i = 0; i < pathParts.length; i++) {
			const pathPart = pathParts[i]
			const isParameterNode = pathPart[0] === ':'
			const isWildcardNode = pathPart[0] === '*'

			let foundNode = currentNode.children.find(
				(node) =>
					node.name === (i === 0 ? '' : '/') + pathPart &&
					(node.method === method || !node.method),
			)

			if (
				foundNode &&
				foundNode.method === method &&
				i === pathParts.length - 1
			)
				throw new Error(`Route ${method} ${path} already exists`)

			if (!foundNode) {
				foundNode = {
					name: (i === 0 ? '' : '/') + pathPart,
					children: [],
					isParameterNode,
					isWildcardNode,
				}

				currentNode.children.push(foundNode)
			}

			currentNode = foundNode
		}

		currentNode.handler = handler
		currentNode.method = method
		;(currentNode as any).fullPath = normalizedPath

		this.addRouteEntry(currentNode, method, normalizedPath)
	}

	_addHookToNode(node: Node, hook: Hook, handler: WobeHandler<any>) {
		switch (hook) {
			case 'beforeHandler': {
				if (!node.beforeHandlerHook) node.beforeHandlerHook = []

				node.beforeHandlerHook.push(handler)
				break
			}
			case 'afterHandler': {
				if (!node.afterHandlerHook) node.afterHandlerHook = []

				node.afterHandlerHook.push(handler)
				break
			}

			case 'beforeAndAfterHandler': {
				if (!node.beforeHandlerHook) node.beforeHandlerHook = []

				if (!node.afterHandlerHook) node.afterHandlerHook = []

				node.beforeHandlerHook.push(handler)
				node.afterHandlerHook.push(handler)
				break
			}
			default:
				break
		}
	}

	addHook(
		hook: Hook,
		path: string,
		handler: WobeHandler<any>,
		method: HttpMethod,
		node?: Node,
	) {
		if (this.isOptimized)
			throw new Error(
				'Cannot add hooks after the tree has been optimized',
			)

		let currentNode = node || this.root

		// For hooks with no specific path
		if (path === '*') {
			const stack = [...currentNode.children]

			while (stack.length > 0) {
				const child = stack.pop() as Node

				if (
					child.handler &&
					(method === child.method || method === 'ALL')
				)
					this._addHookToNode(child, hook, handler)

				if (child.children.length > 0) stack.push(...child.children)
			}

			return
		}

		const pathParts = path.split('/').filter(Boolean)

		for (let i = 0; i < pathParts.length; i++) {
			const pathPart = pathParts[i]
			const isWildcardNode = pathPart[0] === '*'

			if (isWildcardNode) {
				const nextPathJoin = '/' + pathParts.slice(i + 1).join('/')

				for (const child of currentNode.children) {
					if (child.method === method || !child.method)
						this.addHook(hook, nextPathJoin, handler, method, child)
				}

				return
			}

			const foundNode = currentNode.children.find(
				(node) =>
					node.name ===
						(currentNode.name === '/' ? '' : '/') + pathPart &&
					((node.method && node.method === method) || !node.method),
			)

			if (!foundNode) break

			currentNode = foundNode
		}

		this._addHookToNode(currentNode, hook, handler)
	}

	// This function is used to find the route in the tree
	// The path in the node could be for example /a and in children /simple
	// or it can also be /a/simple/route if there is only one children in each node
	findRoute(method: HttpMethod, path: string) {
		const hadTrailingSlash = path.endsWith('/')
		const localPath = this.normalizePath(path)
		const { length: pathLength } = localPath

		if (pathLength === 1 && localPath === '/') return this.root

		// Prefer URLPattern-only matching, pick the most specific (longest path) match
		if (this.hasURLPattern) {
			let bestMatch: RouteEntry | null = null
			let bestLength = -1

			for (const entry of this.routes) {
				if (entry.method !== method && entry.method !== 'ALL') continue

				const { pattern } = entry
				let matched = false

				if (pattern?.test({ pathname: localPath })) {
					matched = true
				} else if (entry.normalizedPath.endsWith('/*')) {
					const prefix = entry.normalizedPath.split('/*')[0]
					if (
						localPath === prefix ||
						localPath.startsWith(prefix + '/')
					)
						matched = true
				} else {
					const paramIndex = entry.normalizedPath.indexOf('/:')
					if (paramIndex !== -1) {
						const prefix = entry.normalizedPath.slice(0, paramIndex)
						if (
							localPath === prefix ||
							(hadTrailingSlash && localPath === prefix)
						)
							matched = true
					}
				}

				if (matched) {
					const len = entry.normalizedPath.length
					if (len > bestLength) {
						bestMatch = entry
						bestLength = len
					}
				}
			}

			if (!bestMatch) return null

			const match = bestMatch.pattern?.exec({ pathname: localPath })

			if (match?.pathname?.groups) {
				const groups = match.pathname.groups
				if (Object.keys(groups).length > 0)
					bestMatch.node.params = groups as Record<string, string>
				else bestMatch.node.params = undefined
			} else {
				bestMatch.node.params = undefined
			}

			return bestMatch.node
		}

		// Fallback to the legacy traversal when URLPattern is unavailable
		let nextIndexToEnd = 0
		let params: Record<string, string> | undefined

		const isNodeMatch = (
			node: Node,
			indexToBegin: number,
			indexToEnd: number,
		): Node | null => {
			const nextIndexToBegin = indexToBegin + (indexToEnd - indexToBegin)

			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i]
				const childName = child.name

				const isChildWildcardOrParameterNode =
					child.isWildcardNode || child.isParameterNode

				nextIndexToEnd = localPath.indexOf(
					'/',
					isChildWildcardOrParameterNode
						? nextIndexToBegin + 1
						: nextIndexToBegin + childName.length - 1,
				)

				if (nextIndexToEnd === -1) nextIndexToEnd = pathLength

				if (indexToEnd === nextIndexToEnd && !child.isWildcardNode)
					continue

				if (
					!isChildWildcardOrParameterNode &&
					nextIndexToEnd - nextIndexToBegin !== childName.length
				)
					continue

				if (child.isParameterNode) {
					if (!params) params = {}

					const indexToAddIfFirstNode = indexToBegin === 0 ? 0 : 1

					params[childName.slice(1 + indexToAddIfFirstNode)] =
						localPath.slice(
							nextIndexToBegin + indexToAddIfFirstNode,
							nextIndexToEnd,
						)
				}

				if (
					isChildWildcardOrParameterNode &&
					child.children.length === 0 &&
					child.method === method
				)
					return child

				if (
					nextIndexToEnd >= pathLength - 1 &&
					(child.method === method || child.method === 'ALL')
				) {
					if (isChildWildcardOrParameterNode) return child

					const pathToCompute = localPath.slice(
						nextIndexToBegin,
						nextIndexToEnd,
					)

					if (pathToCompute === childName) return child
				}

				const foundNode = isNodeMatch(
					child,
					nextIndexToBegin,
					nextIndexToEnd,
				)

				if (foundNode) return foundNode
			}

			return null
		}

		const route = isNodeMatch(this.root, 0, this.root.name.length)

		if (route && params) route.params = params

		return route
	}

	// This function optimize the tree by merging all the nodes that only have one child
	optimizeTree() {
		const optimizeNode = (node: Node) => {
			// Merge multiple nodes that have only one child except parameter, wildcard and root nodes
			if (
				node.children.length === 1 &&
				!node.handler &&
				!node.isParameterNode &&
				!node.children[0].isParameterNode &&
				!node.isWildcardNode &&
				!node.children[0].isWildcardNode &&
				node.name !== '/'
			) {
				const child = node.children[0]

				node.name += child.name
				node.children = child.children
				node.handler = child.handler
				node.method = child.method
				node.beforeHandlerHook = child.beforeHandlerHook
				node.afterHandlerHook = child.afterHandlerHook
				if ((child as any).fullPath) {
					;(node as any).fullPath = (child as any).fullPath
				}

				optimizeNode(node)
			}

			node.children.forEach(optimizeNode)
		}

		optimizeNode(this.root)

		// Rebuild patterns and routes to reflect merged nodes
		this.routes = []
		this.routePatterns.clear()

		const rebuild = (node: Node) => {
			if (node.handler && (node as any).fullPath) {
				this.addRouteEntry(
					node,
					node.method as HttpMethod,
					(node as any).fullPath,
				)
			}

			node.children.forEach(rebuild)
		}

		rebuild(this.root)

		this.isOptimized = true
	}
}
