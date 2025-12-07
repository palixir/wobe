import KoaRouter from '@koa/router'
import type { RouterInterface } from './tools'
import { routes, handler } from './tools'

const name = 'koa-router'
const router = new KoaRouter()

for (const route of routes) {
	if (route.method === 'GET') {
		router.get(route.pathToCompile.replace('*', '/*path'), handler)
	} else {
		router.post(route.pathToCompile, handler)
	}
}

export const koaRouter: RouterInterface = {
	name,
	match: (route) => {
		return router.match(route.path, route.method) // only matching
	},
}
