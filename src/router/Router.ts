export interface Node {
	path: string
	children: Array<Node>
}

export class Router {
	public root: Node = { path: '/', children: [] }

	createNode(path: string): Node {
		return { path, children: [] }
	}

	find(path: string): Node | undefined {
		let currentNode = this.root

		for (let i = 0; i < path.length; i++) {
			const char = path[i]

			if (char === '/' && i !== 0) {
				console.log('HERE', path.slice(i - 1))
				// TODO : Maybe used a for loop
				const nextNode = currentNode.children.find(
					(node) =>
						node.path ===
						path.slice(i - 1, path.indexOf('/', i - 1)),
				)

				if (!nextNode) return undefined

				currentNode = nextNode
			}
		}

		return currentNode
	}

	compile(routes: Array<string>) {
		for (let i = 0; i < routes.length; i++) {
			let route = routes[i]

			let previousWildcardIndex = 0
			let currentNode = this.root

			if (route[0] !== '/') route = '/' + route

			if (route[route.length - 1] === '*') route = route.slice(0, -1)

			for (let j = 0; j < route.length; j++) {
				const char = route[j]

				if ((char === '/' && j !== 0) || j === route.length - 1) {
					const node = this.createNode(
						route.slice(previousWildcardIndex + 1, j + 1),
					)

					currentNode.children.push(node)

					currentNode = node
					previousWildcardIndex = j

					continue
				}
			}
		}
	}
}
