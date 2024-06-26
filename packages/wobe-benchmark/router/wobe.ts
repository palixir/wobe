import { RadixTree } from 'wobe/src/router'
import { routes, type Route } from './tools'

const createWobeRouter = (name: string, radixTree: RadixTree) => {
	for (const route of routes) {
		radixTree.addRoute(route.method, route.pathToCompile, () =>
			Promise.resolve(),
		)
	}

	radixTree.optimizeTree()

	return {
		name: `Wobe ${name}`,
		match: (route: Route) => {
			return radixTree.findRoute(route.method, route.path)
		},
	}
}

export const wobeRouter = createWobeRouter('Radix router', new RadixTree())
