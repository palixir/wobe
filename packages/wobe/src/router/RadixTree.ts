import type { Hook, HttpMethod, WobeHandler } from '../Wobe'

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

export class RadixTree {
	public root: Node = { name: '/', children: [] }
	private isOptimized = false

	addRoute(method: HttpMethod, path: string, handler: WobeHandler<any>) {
		const pathParts = path.split('/').filter(Boolean)

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

		const pathParts = path.split('/').filter(Boolean)
		let currentNode = node || this.root

		// For hooks with no specific path
		if (path === '*') {
			const addHookToChildren = (node: Node) => {
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i]

					if (
						child.handler &&
						(method === child.method || method === 'ALL')
					)
						this._addHookToNode(child, hook, handler)

					addHookToChildren(child)
				}
			}

			for (let i = 0; i < currentNode.children.length; i++) {
				const child = currentNode.children[i]

				addHookToChildren(child)
			}
		}

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
		let localPath = path
		if (path[0] !== '/') localPath = '/' + path

		const { length: pathLength } = localPath

		if (pathLength === 1 && localPath === '/') return this.root

		let nextIndexToEnd = 0
		let params: Record<string, string> | undefined = undefined

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

				// We get the next end index
				nextIndexToEnd = localPath.indexOf(
					'/',
					isChildWildcardOrParameterNode
						? nextIndexToBegin + 1
						: nextIndexToBegin + childName.length - 1,
				)

				if (nextIndexToEnd === -1) nextIndexToEnd = pathLength

				if (indexToEnd === nextIndexToEnd && !child.isWildcardNode)
					continue

				// If the child is not a wildcard or parameter node
				// and the length of the child name is different from the length of the path
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

				// If the child has no children and the node is a wildcard or parameter node
				if (
					isChildWildcardOrParameterNode &&
					child.children.length === 0
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

		if (params && route) route.params = params

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

				optimizeNode(node)
			}

			node.children.forEach(optimizeNode)
		}

		optimizeNode(this.root)

		this.isOptimized = true
	}
}
