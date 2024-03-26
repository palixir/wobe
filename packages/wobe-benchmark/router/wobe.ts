import { Router } from 'wobe/src/router'
import { routes, type Route } from './tools'

const createWobeRouter = (name: string, router: Router) => {
	// @ts-expect-error
	router.compile(routes)

	return {
		name: `Wobe ${name}`,
		match: (route: Route) => {
			router.find({ method: route.method, path: route.path })
		},
	}
}

export const wobeRouter = createWobeRouter('Radix router', new Router())
