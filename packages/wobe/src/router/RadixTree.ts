import type { HttpMethod } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: (...args: any[]) => Promise<any> | any
	method?: HttpMethod
	isParameterNode?: boolean
	isWildcardNode?: boolean
	maxChildLength: number
	indexOfChildWildcardOrParameterNode?: number
}

export class RadixTree {
	public root: Node = { name: '/', children: [], maxChildLength: 0 }

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
					maxChildLength: 0,
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

		const { length: pathLength } = path

		const isNodeMatch = (
			node: Node,
			indexToBegin: number,
			indexToEnd: number,
		): Node | null => {
			const { length: numberOfChildren } = node.children
			const {
				isParameterNode,
				isWildcardNode,
				method: nodeMethod,
				name: nodeName,
			} = node

			if (indexToBegin > 0) {
				if (
					indexToEnd - indexToBegin !== nodeName.length &&
					!isParameterNode &&
					!isWildcardNode
				)
					return null

				const pathToCompute = path.substring(indexToBegin, indexToEnd)

				const isPathToComputeEqualToNodeName =
					pathToCompute === nodeName

				const isWildcardOrParameter = isParameterNode || isWildcardNode

				if (!isWildcardOrParameter) {
					if (nodeMethod && method !== nodeMethod) return null
					if (!isPathToComputeEqualToNodeName) return null
				}

				const isLastElement =
					indexToEnd === pathLength || indexToEnd === pathLength - 1

				// => Explanation:  indexToEnd === pathLength || indexToEnd === pathLength - 1
				// We can have a / at the end of the path
				if (isLastElement || isWildcardOrParameter) {
					if (numberOfChildren === 0) return node

					if (
						node.handler &&
						(isPathToComputeEqualToNodeName ||
							isWildcardOrParameter) &&
						isLastElement
					)
						return node
				}
			}

			const nextIndexToBegin = indexToBegin + (indexToEnd - indexToBegin)

			for (let i = 0; i < numberOfChildren; i++) {
				const child = node.children[i]

				let nextIndexToEnd = 0

				if (child.isWildcardNode || child.isParameterNode) {
					nextIndexToEnd = path.indexOf('/', nextIndexToBegin + 1)
				} else {
					nextIndexToEnd = path.indexOf(
						'/',
						nextIndexToBegin + child.name.length - 1,
					)

					// If the path is bigger than the child name and the child don't have any children
					// if (
					// 	nextIndexToEnd < pathLength &&
					// 	child.children.length === 0
					// )
					// 	nextIndexToEnd = pathLength
				}

				if (nextIndexToEnd === -1) nextIndexToEnd = pathLength

				if (!child.isWildcardNode && indexToEnd === nextIndexToEnd)
					continue

				const foundNode = isNodeMatch(
					child,
					nextIndexToBegin,
					nextIndexToEnd,
				)

				if (foundNode) return foundNode
			}

			return null
		}

		return isNodeMatch(this.root, 0, this.root.name.length)
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
				node.maxChildLength = child.maxChildLength

				optimizeNode(node)
			}

			node.children.forEach(optimizeNode)

			// add maxChildLength to allow to get the index of the end for substring in find
			if (node.children.length > 0) {
				let indexOfChildWildcardOrParameterNode = -1
				let maxChildLength = -99999999
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i]
					if (child.name.length > maxChildLength)
						maxChildLength = child.name.length

					if (child.isParameterNode || child.isWildcardNode)
						indexOfChildWildcardOrParameterNode = i
				}

				node.maxChildLength = maxChildLength
				node.indexOfChildWildcardOrParameterNode =
					indexOfChildWildcardOrParameterNode
			}
		}

		optimizeNode(this.root)
	}
}
