import type { HttpMethod, Routes, WobeHandler } from '../Wobe'

export interface Node {
	name: string
	children: Array<Node>
	handler?: WobeHandler
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
		handler?: WobeHandler
		method?: HttpMethod
		isParameterNode?: boolean
	}): Node {
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

	// This function compute an element of the array and add all children to the current node
	addAllChidrenToACurrentNodeRecursively({
		arrayOfElements,
		indexToCompute,
		currentNode,
		routes,
	}: {
		arrayOfElements: Array<{
			name: string
			routeId: number
			childrenIndex: Array<number>
			parentIndex: number
		}>
		indexToCompute: number
		currentNode: Node
		routes: Routes
	}): { computedChildrenIndex: Array<number>; currentNode: Node } {
		const element = arrayOfElements[indexToCompute]

		let computedChildrenIndex: Array<number> = []
		let currentPath = element.name

		if (element.childrenIndex.length === 1) {
			currentPath += arrayOfElements[element.childrenIndex[0]].name

			const {
				currentNode: newCurrentNode,
				computedChildrenIndex: newComputedChildrenIndex,
			} = this.addAllChidrenToACurrentNodeRecursively({
				arrayOfElements,
				indexToCompute: element.childrenIndex[0],
				currentNode,
				routes,
			})

			computedChildrenIndex.push(...newComputedChildrenIndex)
		}

		// const childNode = this.createNode({
		// 	path: currentPath,
		// 	handler: routes[arrayOfElements[indexToCompute].routeId].handler,
		// 	method: routes[arrayOfElements[indexToCompute].routeId].method,
		// 	isParameterNode: false,
		// })

		// currentNode.children.push(childNode)

		// currentNode = childNode

		computedChildrenIndex.push(indexToCompute)

		// for (let i = 0; i < element.childrenIndex.length; i++) {
		// 	const childIndex = element.childrenIndex[i]

		// 	if (computedChildrenIndex.includes(childIndex)) continue

		// 	let currentPath = element.name

		// If child has only one child, we can merge the path
		// if (arrayOfElements[childIndex].childrenIndex.length === 1) {
		// 	currentPath +=
		// 		arrayOfElements[
		// 			arrayOfElements[childIndex].childrenIndex[0]
		// 		].name
		// }

		// console.log({ element }, arrayOfElements[childIndex])

		// Child node
		// const childNode = this.createNode({
		// 	path: currentPath,
		// 	handler: routes[arrayOfElements[childIndex].routeId].handler,
		// 	method: routes[arrayOfElements[childIndex].routeId].method,
		// 	isParameterNode: false,
		// })

		// 	// If there is more than one child we need to process recursively
		// 	if (arrayOfElements[childIndex].childrenIndex.length > 1) {
		// 		computedChildrenIndex.push(
		// 			...this.addAllChidrenToACurrentNodeRecursively({
		// 				arrayOfElements,
		// 				currentNode: childNode,
		// 				indexToCompute: childIndex,
		// 				routes,
		// 			}),
		// 		)
		// 	}

		// 	currentNode.children.push(childNode)
		// }

		return { computedChildrenIndex, currentNode }
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

		let currentNode = this.root
		const alreadyComputed: Array<number> = []

		for (let i = 0; i < tmp.length; i++) {
			if (alreadyComputed.includes(i)) continue

			const { computedChildrenIndex, currentNode: newCurrentnode } =
				this.addAllChidrenToACurrentNodeRecursively({
					arrayOfElements: tmp,
					indexToCompute: i,
					currentNode,
					routes,
				})

			alreadyComputed.push(...computedChildrenIndex)

			currentNode = newCurrentnode

			// console.log(tata)
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
