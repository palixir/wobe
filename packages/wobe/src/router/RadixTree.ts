import type { HttpMethod } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: (...args: any[]) => Promise<any> | any
	method?: HttpMethod
	isParameterNode?: boolean
	isWildcardNode?: boolean
	maxChildLength: number
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
	// 172 ns
	findRoute(method: HttpMethod, path: string) {
		// if (path[0] !== '/') path = '/' + path

		// if (path[path.length - 1] !== '/') path += '/'
		// if (path[path.length - 1] === '*') path = path.slice(0, -1)

		// const { length: pathLength } = path

		// const isNodeMatch = (
		// 	node: Node,
		// 	indexToBegin: number,
		// 	indexToEnd: number,
		// ): Node | null => {
		// 	let foundNode: Node | null = null

		// 	const pathToCompute = path.substring(indexToBegin, indexToEnd)
		// 	const { length: numberOfChildren } = node.children
		// 	const { isParameterNode, isWildcardNode, method: nodeMethod } = node

		// 	if (
		// 		(pathToCompute !== node.name ||
		// 			(nodeMethod && method !== nodeMethod)) &&
		// 		!isParameterNode &&
		// 		!isWildcardNode
		// 	)
		// 		return null

		// 	if (
		// 		numberOfChildren === 0 &&
		// 		(indexToEnd === pathLength - 1 ||
		// 			isParameterNode ||
		// 			isWildcardNode)
		// 	)
		// 		return node

		// 	for (let i = 0; i < numberOfChildren; i++) {
		// 		const child = node.children[i]
		// 		let nextIndexToBegin = indexToBegin + pathToCompute.length
		// 		let nextIndexToEnd = indexToEnd + child.name.length

		// 		if (child.isParameterNode || child.isWildcardNode) {
		// 			// +1 because we need to skip a / because we don't care what is at the place of the parameter
		// 			nextIndexToBegin = path.indexOf('/', indexToBegin + 1)

		// 			// +1 because we need to skip a / because we don't care what is at the place of the parameter
		// 			nextIndexToEnd = path.indexOf('/', indexToEnd + 1)

		// 			if (nextIndexToEnd === -1 && child.isWildcardNode)
		// 				nextIndexToEnd = pathLength - 1

		// 			if (nextIndexToEnd === -1 && indexToEnd === pathLength - 1)
		// 				return null
		// 		}

		// 		foundNode = isNodeMatch(child, nextIndexToBegin, nextIndexToEnd)

		// 		if (foundNode) return foundNode
		// 	}

		// 	return foundNode
		// }

		// return isNodeMatch(this.root, 0, this.root.name.length)
		//

		// Other implementation
		let currentNode = this.root
		let isFounded = false
		let beginIndex = 1

		if (path[0] !== '/') path = '/' + path
		if (path[path.length - 1] === '*') path = path.slice(0, -1)
		if (path[path.length - 1] === '/') path = path.slice(0, -1)

		while (true) {
			let endIndex =
				currentNode.maxChildLength > 0
					? currentNode.maxChildLength + 1
					: path.length

			if (currentNode.isWildcardNode) {
				endIndex = path.indexOf('/', beginIndex + 1)
			}

			const currentPath = path.substring(beginIndex, endIndex)

			console.log(
				{ currentPath, path, endIndex, pathLength: path.length },
				currentNode,
			)

			if (currentPath.length > 0) {
				// Use for loop instead of find because it's faster (around 15-20%)
				for (let j = 0; j < currentNode.children.length; j++) {
					const child = currentNode.children[j]

					if (
						child.isParameterNode ||
						child.isWildcardNode ||
						(child.name === currentPath &&
							(!child.method ||
								(child.method && child.method === method)))
					) {
						currentNode = child
						isFounded = true

						if (child.method && endIndex >= path.length)
							return child
						break
					}
				}
			}

			if (!isFounded) return null

			isFounded = false
			beginIndex = endIndex
		}
	}

	// This function optimize the tree by merging all the nodes that only have one child
	optimizeTree() {
		const optimizeNode = (node: Node) => {
			// Merge multiple nodes that have only one child except parameter, wildcard and root nodes
			if (
				node.children.length === 1 &&
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
				let maxChildLength = -99999999
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i]
					if (child.name.length > maxChildLength)
						maxChildLength = child.name.length
				}

				node.maxChildLength = maxChildLength
			}
		}

		optimizeNode(this.root)
	}
}
