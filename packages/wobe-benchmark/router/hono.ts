import type { Router } from 'hono/router'
import { handler, routes, type RouterInterface } from './tools'
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { TrieRouter } from 'hono/router/trie-router'
import { SmartRouter } from 'hono/router/smart-router'

const createHonoRouter = (name: string, router: Router<unknown>): RouterInterface => {
	for (const route of routes) {
		router.add(route.method, route.pathToCompile, handler)
	}

	return {
		name: `Hono ${name}`,
		match: (route) => {
			return router.match(route.method, route.path)
		},
	}
}

export const smartRouter = createHonoRouter(
	'SmartRouter (RegExp + Trie)',
	new SmartRouter({
		routers: [new RegExpRouter(), new TrieRouter()],
	}),
)
export const trieRouter = createHonoRouter('TrieRouter', new TrieRouter())
