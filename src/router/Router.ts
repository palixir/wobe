import type { HttpMethod, Routes } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: Function
	method?: HttpMethod
}

export class Router {
	public root: Node = { name: '/', children: [] }

	createNode({
		path,
		handler,
		method,
	}: {
		path: string
		handler: Function
		method: HttpMethod
	}): Node {
		return { name: path, children: [], handler, method }
	}

	find({
		path,
		method,
	}: {
		path: string
		method: HttpMethod
	}): Node | undefined {
		let currentNode = this.root
		let currentPath = ''

		if (path[path.length - 1] === '*') path = path.slice(0, -1)

		for (let i = 1; i < path.length; i++) {
			const char = path[i]

			const isCharIsSlash = char === '/'

			if (!isCharIsSlash) currentPath += char

			if ((isCharIsSlash && i !== 0) || i === path.length - 1) {
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

	compile(routes: Routes) {
		for (let i = 0; i < routes.length; i++) {
			let route = routes[i].path

			let previousSlashIndex = 0
			let currentNode = this.root

			if (route[0] !== '/') route = '/' + route

			if (route[route.length - 1] === '*') route = route.slice(0, -1)

			for (let j = 0; j < route.length; j++) {
				const char = route[j]

				if ((char === '/' && j !== 0) || j === route.length - 1) {
					const currentPath = route.slice(
						// + 1 to remove the / at the begining
						previousSlashIndex + 1,
						// + 1 to remove the ending / if no slash at the end
						char === '/' ? j : j + 1,
					)

					const routeAlreadyExist = currentNode.children.find(
						(node) => node.name === currentPath,
					)

					// We remove the slash to optimize the research
					const node = this.createNode({
						path: currentPath,
						handler: routes[i].handler,
						method: routes[i].method,
					})

					previousSlashIndex = j

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
