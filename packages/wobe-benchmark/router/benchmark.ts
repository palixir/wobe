import { run, bench, group } from 'mitata'
import { routes, type RouterInterface } from './tools'
import { regExpRouter, trieRouter } from './hono'
import { wobeRouter } from './wobe'
import { findMyWayRouter } from './findMyWay'

const routers: RouterInterface[] = [
	regExpRouter,
	trieRouter,
	wobeRouter,
	findMyWayRouter,
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
