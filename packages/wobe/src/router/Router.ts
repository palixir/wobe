import type { HttpMethod, Routes, WobeHandler } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: WobeHandler
	method?: HttpMethod
	isParameterNode?: boolean
}

export class Router {
	private numberOfNodes = 0
	public root: Node = { name: '/', children: [] }

	createNode({
		path,
		handler,
		method,
		isParameterNode,
	}: {
		path: string
		handler?: WobeHandler
		method?: HttpMethod
		isParameterNode?: boolean
	}): Node {
		this.numberOfNodes += 1
		return { name: path, children: [], handler, method, isParameterNode }
	}

	isMiddlewarePathnameMatchWithRoute({
		route,
		middlewarePathname,
	}: {
		route: string
		middlewarePathname: string
	}): boolean {
		if (middlewarePathname[middlewarePathname.length - 1] === '/')
			middlewarePathname = middlewarePathname.slice(0, -1)

		const isPathNameEndingByWildcard =
			middlewarePathname[middlewarePathname.length - 1] === '*'

		if (
			middlewarePathname.length > route.length &&
			!isPathNameEndingByWildcard
		)
			return false

		let isWildcardEncountering = false

		for (let i = 0; i < route.length; i++) {
			const routeChar = route[i]
			const middlewarePathnameChar = middlewarePathname[i]

			if (middlewarePathnameChar === '*') {
				isWildcardEncountering = true
				continue
			}

			if (isWildcardEncountering) {
				if (middlewarePathnameChar === '/') {
					isWildcardEncountering = false
				}

				continue
			}

			if (routeChar !== middlewarePathnameChar) return false
		}

		return true
	}

	toStringNode(node: Node): string {
		const result = node.children
			.map((child) => {
				return this.toStringNode(child)
			})
			.join(',')

		return `Path : "${node.name}" :
		 Children :
		  - ${result}
		`
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

				if (currentPath.length > 0) {
					// Use for loop instead of find because it's faster (around 15-20%)
					for (let j = 0; j < currentNode.children.length; j++) {
						const child = currentNode.children[j]

						if (
							child.isParameterNode ||
							child.name === '*' ||
							(child.name === currentPath &&
								(!child.method || child.method === method))
						) {
							currentNode = child
							isFounded = true
							break
						}
					}
				}

				if (!isFounded) return undefined

				isFounded = false
				indexOfLastSlash = i
			}
		}

		return currentNode
	}

	/*
    /a/simple/route
    /a/simple/route2

    1 : La partie commune = la route entière
    2 : On split la route par /
    3 : On regarde si la partie commune commence par le split[0] ?
    4 : Si oui, on regarde si le split[1] aussi
    5 : Si non on ajoute une deuxième route de base

  */

	compileV3(routes: Routes) {
		for (let i = 0; i < routes.length; i++) {
			let currentRoutePath = routes[i].path

			if (currentRoutePath[0] !== '/')
				currentRoutePath = '/' + currentRoutePath

			if (currentRoutePath[currentRoutePath.length - 1] === '*')
				currentRoutePath = currentRoutePath.slice(0, -1)

			if (currentRoutePath[currentRoutePath.length - 1] === '/')
				currentRoutePath = currentRoutePath.slice(0, -1)

			for (let j = 1; j < currentRoutePath.length; j++) {
				const char = currentRoutePath[j]
			}
		}
	}

	compileV2(routes: Routes) {
		const tmp: Array<{
			name: string
			routeId: number
			childrenIndex: Array<number>
			parentIndex: number
		}> = []

		for (let i = 0; i < routes.length; i++) {
			let currentRoutePath = routes[i].path
			let previousSlashIndex = 0
			let parentIndex = -1

			if (currentRoutePath[0] !== '/')
				currentRoutePath = '/' + currentRoutePath

			if (currentRoutePath[currentRoutePath.length - 1] === '*')
				currentRoutePath = currentRoutePath.slice(0, -1)

			if (currentRoutePath[currentRoutePath.length - 1] === '/')
				currentRoutePath = currentRoutePath.slice(0, -1)

			for (let j = 1; j < currentRoutePath.length; j++) {
				const char = currentRoutePath[j]

				if (char === '/' || j === currentRoutePath.length - 1) {
					const currentPath = currentRoutePath.slice(
						previousSlashIndex,
						j === currentRoutePath.length - 1 ? j + 1 : j,
					)

					const existingRouteIndex = tmp.findIndex(
						(node) =>
							node.name === currentPath &&
							node.parentIndex === parentIndex,
					)

					if (existingRouteIndex !== -1) {
						parentIndex = existingRouteIndex
					}

					if (existingRouteIndex === -1) {
						if (parentIndex !== -1)
							tmp[parentIndex].childrenIndex.push(tmp.length)

						tmp.push({
							name: currentPath,
							routeId: i,
							childrenIndex: [],
							parentIndex,
						})

						parentIndex = tmp.length - 1
					}

					previousSlashIndex = j
				}
			}
		}

		// console.log(tmp)

		// Second part

		const tmp2: Array<{
			name: string
			routeId: number
			childrenIndex: Array<number>
			parentIndex: number
		}> = []

		for (let i = 0; i < routes.length; i++) {
			let currentRoutePath = routes[i].path
			let previousSlashIndex = 0
			let parentIndex = -1

			if (currentRoutePath[0] !== '/')
				currentRoutePath = '/' + currentRoutePath

			if (currentRoutePath[currentRoutePath.length - 1] === '*')
				currentRoutePath = currentRoutePath.slice(0, -1)

			if (currentRoutePath[currentRoutePath.length - 1] === '/')
				currentRoutePath = currentRoutePath.slice(0, -1)

			for (let j = 1; j < currentRoutePath.length; j++) {
				const char = currentRoutePath[j]

				if (char === '/' || j === currentRoutePath.length - 1) {
					const currentPath = currentRoutePath.slice(
						previousSlashIndex,
						j === currentRoutePath.length - 1 ? j + 1 : j,
					)

					const similarPath = tmp.find(
						(element) => element.name === currentPath,
					)

					if (similarPath?.childrenIndex.length === 1) continue

					const existingRouteIndex = tmp2.findIndex(
						(node) =>
							node.name === currentPath &&
							node.parentIndex === parentIndex,
					)

					if (existingRouteIndex !== -1) {
						parentIndex = existingRouteIndex
					}

					if (existingRouteIndex === -1) {
						if (parentIndex !== -1)
							tmp[parentIndex].childrenIndex.push(tmp2.length)

						tmp2.push({
							name: currentPath,
							routeId: i,
							childrenIndex: [],
							parentIndex,
						})

						parentIndex = tmp2.length - 1
					}

					previousSlashIndex = j
				}
			}
		}

		console.log(tmp2)
	}

	postCompile() {
		let currentNode = this.root
		let parentNode = currentNode
		let numberOfNodes = 0
		let childrenIndex = 0

		while (numberOfNodes < this.numberOfNodes) {
			const children = currentNode.children

			if (children.length === 0) {
				currentNode = parentNode
				numberOfNodes += 1
				childrenIndex += 1

				continue
			}

			if (children.length === 1) {
				currentNode.name += children[0].name
				currentNode.children = children[0].children
				numberOfNodes += 1
				currentNode = parentNode

				continue
			}

			parentNode = currentNode
		}
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

					previousSlashIndex = j

					if (routeAlreadyExist) {
						currentNode = routeAlreadyExist

						continue
					}

					const node = this.createNode({
						path: currentPath,
						isParameterNode: currentPath[0] === ':',
					})

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
