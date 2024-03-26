import { run, bench, group } from 'mitata'
import { routes, type RouterInterface } from './tools'
import { regExpRouter, trieRouter } from './hono'
import { wobeRouter } from './wobe'
import { findMyWayRouter } from './findMyWay'
import { koaRouter } from './koaRouter'

const routers: RouterInterface[] = [
	regExpRouter,
	trieRouter,
	findMyWayRouter,
	koaRouter,
	wobeRouter,
]

for (const route of routes) {
	group(`${route.name} - ${route.method} ${route.path}`, () => {
		for (const router of routers) {
			bench(router.name, async () => {
				router.match(route)
			})
		}
	})
}

group('all together', () => {
	for (const router of routers) {
		bench(router.name, async () => {
			for (const route of routes) {
				router.match(route)
			}
		})
	}
})

await run()
