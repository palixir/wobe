export interface Node {
	name: string
	children: Array<Node>
}

export class Router {
	public root: Node = { name: '/', children: [] }

	createNode(path: string): Node {
		return { name: path, children: [] }
	}

	find(path: string): Node | undefined {
		let currentNode = this.root
		let currentPath = ''

		if (path[path.length - 1] === '*') path = path.slice(0, -1)

		for (let i = 1; i < path.length; i++) {
			const char = path[i]

			if (char !== '/') currentPath += char

			if ((char === '/' && i !== 0) || i === path.length - 1) {
				// TODO : Maybe used a for loop
				const nextNode = currentNode.children.find(
					(node) =>
						node.name === currentPath ||
						(node.name[0] === ':' && currentPath !== ''),
				)

				if (!nextNode) return undefined

				currentNode = nextNode
				currentPath = ''
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
					const currentPath = route.slice(
						// + 1 to remove the / at the begining
						previousWildcardIndex + 1,
						// + 1 to remove the ending / if no wildcard at the end
						char === '/' ? j : j + 1,
					)

					const routeAlreadyExist = currentNode.children.find(
						(node) => node.name === currentPath,
					)

					// We remove the wildcard to optimize the research
					const node = this.createNode(currentPath)

					previousWildcardIndex = j

					if (routeAlreadyExist) {
						currentNode = routeAlreadyExist

						continue
					}

					// The following use case is not authorized because the id can be interpreted as a parameter
					// /user/:id/info and /user/id/anyway are not authorized
					if (currentPath[0] !== ':') {
						const sameRouteWithDynamicParameter =
							currentNode.children.find(
								(node) => node.name[0] === ':',
							)

						if (sameRouteWithDynamicParameter)
							throw new Error(
								`Route already exist with the "${sameRouteWithDynamicParameter.name}" parameter`,
							)
					}

					currentNode.children.push(node)

					currentNode = node
				}
			}
		}
	}
}
