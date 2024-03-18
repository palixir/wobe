import type { HttpMethod, Routes } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: Function
	method?: HttpMethod
	isParameterNode?: boolean
}

export class Router {
	public root: Node = { name: '/', children: [] }

	createNode({
		path,
		handler,
		method,
		isParameterNode,
	}: {
		path: string
		handler?: Function
		method?: HttpMethod
		isParameterNode?: boolean
	}): Node {
		return { name: path, children: [], handler, method, isParameterNode }
	}

	find({
		path,
		method,
	}: {
		path: string
		method: HttpMethod
	}): Node | undefined {
		let currentNode = this.root
		let isFounded = false
		let indexOfLastSlash = 0

		if (path[0] !== '/') path = '/' + path
		if (path[path.length - 1] === '*') path = path.slice(0, -1)
		if (path[path.length - 1] === '/') path = path.slice(0, -1)

		const pathLength = path.length

		for (let i = 1; i < pathLength; i++) {
			const isLastCharacter = i === pathLength - 1

			if (path[i] === '/' || isLastCharacter) {
				const currentPath = path.substring(
					indexOfLastSlash + 1,
					isLastCharacter ? i + 1 : i,
				)

				// Use for loop instead of find because it's faster (around 15-20%)
				for (let j = 0; j < currentNode.children.length; j++) {
					const child = currentNode.children[j]

					if (currentPath.length === 0) continue

					if (
						child.isParameterNode ||
						(child.name === currentPath &&
							(!child.method || child.method === method))
					) {
						currentNode = child
						isFounded = true
						break
					}
				}

				if (!isFounded) return undefined

				isFounded = false
				indexOfLastSlash = i
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
						(node) =>
							node.name === currentPath &&
							// Node method is undefined for note ending node
							(!node.method || node.method === routes[i].method),
					)

					// We remove the slash to optimize the research
					const node = this.createNode({
						path: currentPath,
						isParameterNode: currentPath[0] === ':',
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

			currentNode.handler = routes[i].handler
			currentNode.method = routes[i].method
		}
	}
}
