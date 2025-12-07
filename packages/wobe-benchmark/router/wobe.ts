import { routes, type Route } from './tools'
import { UrlPatternRouter, type Router } from 'wobe'

const createWobeRouter = (name: string, radixTree: Router) => {
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

export const wobeRouter = createWobeRouter(
	'UrlPattern router',
	new UrlPatternRouter(),
)
