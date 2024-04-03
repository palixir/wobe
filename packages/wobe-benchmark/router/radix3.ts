import { createRouter } from 'radix3'
import { handler, routes, type RouterInterface } from './tools'

const name = 'radix3'
const router = createRouter()

for (const route of routes) {
	router.insert(route.pathToCompile, handler)
}

export const radix3Router: RouterInterface = {
	name,
	match: (route) => {
		return router.lookup(route.path)
	},
}
