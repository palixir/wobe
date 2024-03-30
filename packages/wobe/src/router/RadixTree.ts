import type { HttpMethod } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: (...args: any[]) => Promise<any> | any
	method?: HttpMethod
	isParameterNode?: boolean
	isWildcardNode?: boolean
}

export class RadixTree {
	public root: Node = { name: '/', children: [] }

	constructor() {}

	addRoute(
		method: HttpMethod,
		path: string,
		handler: (...args: any[]) => Promise<any>,
	) {
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

	// This function is used to find the route in the tree
	// The path in the node could be for example /a and in children /simple
	// or it can also be /a/simple/route if there is only one children in each node
	findRoute(method: HttpMethod, path: string) {
		if (path[0] !== '/') path = '/' + path

		if (path[path.length - 1] !== '/') path = path + '/'
		if (path[path.length - 1] === '*') path = path.slice(0, -1)

		const pathLength = path.length

		const isNodeMatch = (
			node: Node,
			indexToBegin: number,
			indexToEnd: number,
		): Node | null => {
			let foundNode: Node | null = null

			const pathToCompute = path.substring(indexToBegin, indexToEnd)
			const numberOfChildren = node.children.length

			if (
				(pathToCompute !== node.name ||
					(node.method && method !== node.method)) &&
				!node.isParameterNode &&
				!node.isWildcardNode
			)
				return null

			if (
				numberOfChildren === 0 &&
				(indexToEnd === pathLength - 1 || node.isParameterNode)
			)
				return node

			for (let i = 0; i < numberOfChildren; i++) {
				let nextIndexToBegin = indexToBegin + pathToCompute.length
				let nextIndexToEnd = indexToEnd + node.children[i].name.length

				// /a/simple/route/*/
				// /a/simple/route/

				if (
					node.children[i].isParameterNode ||
					node.children[i].isWildcardNode
				) {
					// +1 because we need to skip a / because we don't care what is at the place of the parameter
					nextIndexToBegin = path.indexOf('/', indexToBegin + 1)

					// +1 because we need to skip a / because we don't care what is at the place of the parameter
					nextIndexToEnd = path.indexOf('/', indexToEnd + 1)

					if (
						nextIndexToEnd === -1 &&
						node.children[i].isWildcardNode
					) {
						nextIndexToEnd = pathLength - 1
					}

					if (nextIndexToEnd === -1 && indexToEnd === pathLength - 1)
						return null
				}

				foundNode = isNodeMatch(
					node.children[i],
					nextIndexToBegin,
					nextIndexToEnd,
				)

				if (foundNode) return foundNode
			}

			return foundNode
		}

		return isNodeMatch(this.root, 0, this.root.name.length)
	}

	// This function optimize the tree by merging all the nodes that only have one child
	optimizeTree() {
		const optimizeNode = (node: Node) => {
			if (
				node.children.length === 1 &&
				!node.isParameterNode &&
				!node.children[0].isParameterNode &&
				!node.isWildcardNode &&
				!node.children[0].isWildcardNode
			) {
				const child = node.children[0]

				node.name += child.name
				node.children = child.children
				node.handler = child.handler
				node.method = child.method

				optimizeNode(node)
			}

			node.children.forEach(optimizeNode)
		}

		optimizeNode(this.root)
	}
}
