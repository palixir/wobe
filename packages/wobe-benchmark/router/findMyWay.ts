import type { HTTPMethod } from 'find-my-way'
import findMyWay from 'find-my-way'
import type { RouterInterface } from './tools'
import { routes, handler } from './tools'

const name = 'find-my-way'
const router = findMyWay()

for (const route of routes) {
	router.on(route.method as HTTPMethod, route.path, handler)
}

export const findMyWayRouter: RouterInterface = {
	name,
	match: (route) => {
		router.find(route.method as HTTPMethod, route.path)
	},
}
