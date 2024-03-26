import type { Router } from 'hono/router'
import { handler, routes, type RouterInterface } from './tools'
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { TrieRouter } from 'hono/router/trie-router'

const createHonoRouter = (
	name: string,
	router: Router<unknown>,
): RouterInterface => {
	for (const route of routes) {
		router.add(route.method, route.path, handler)
	}

	return {
		name: `Hono ${name}`,
		match: (route) => {
			router.match(route.method, route.path)
		},
	}
}

export const regExpRouter = createHonoRouter('RegExpRouter', new RegExpRouter())
export const trieRouter = createHonoRouter('TrieRouter', new TrieRouter())
