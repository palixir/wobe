import type { HttpMethod } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: (...args: any[]) => Promise<any> | any
	method?: HttpMethod
	isParameterNode?: boolean
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

			let foundNode = currentNode.children.find(
				(node) =>
					node.name === '/' + pathPart &&
					(node.method === method || !node.method),
			)

			if (!foundNode) {
				console.log(pathPart)
				foundNode = {
					name: '/' + pathPart,
					children: [],
					isParameterNode,
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
		const isNodeMatch = (node: Node, path: string): Node | null => {
			let foundNode: Node | null = node
			let nodeNameIndex = 0

			// /a/simple/route
			// /a/simple/route

			for (let i = 0; i < path.length; i++) {
				const currentChar = path[i]
				const currentNodeChar = node.name[nodeNameIndex]

				console.log({ currentChar, currentNodeChar, node })

				if (currentChar !== currentNodeChar) return null

				if (nodeNameIndex === node.name.length - 1) {
					for (let k = 0; k < node.children.length; k++) {
						foundNode = isNodeMatch(
							node.children[k],
							path.slice(nodeNameIndex + 1),
						)

						if (foundNode) {
							foundNode = node.children[k]
							break
						}
					}
				}

				nodeNameIndex++
			}

			return foundNode
		}

		return isNodeMatch(this.root, path)
	}

	// This function optimize the tree by merging all the nodes that only have one child
	optimizeTree() {
		const optimizeNode = (node: Node) => {
			if (node.children.length === 1) {
				const child = node.children[0]

				node.name += `${node.name[node.name.length - 1] !== '/' ? '/' : ''}${child.name}`
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
