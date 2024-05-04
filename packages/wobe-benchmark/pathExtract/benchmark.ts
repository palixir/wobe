import { getPath, getQueryParams } from 'hono/utils/url'
import { run, bench, group } from 'mitata'
import { extractPathnameAndSearchParams } from 'wobe'

interface RouteInterface {
	request: Request
	hasParams: boolean
}

const routes: Array<RouteInterface> = [
	{
		request: new Request('https://localhost:3000/user/comments'),
		hasParams: false,
	},
	{
		request: new Request('https://localhost:3000/user/lookup/username/hey'),
		hasParams: false,
	},
	{
		request: new Request('https://localhost:3000/event/abcd1234/comments'),
		hasParams: false,
	},
	{
		request: new Request('https://localhost:3000/event/abcd1234/comment'),
		hasParams: false,
	},
	{
		request: new Request(
			'https://localhost:3000/very/deeply/nested/route/hello/there',
		),
		hasParams: false,
	},
	{
		request: new Request('http://localhost:3000/test?name=John&age=30'),
		hasParams: true,
	},
]

const extracters = [
	{
		name: 'Wobe',
		fn: ({ request }: RouteInterface) => {
			return extractPathnameAndSearchParams(request.url)
		},
	},
	{
		name: 'Hono',
		fn: ({ request, hasParams }: RouteInterface) => {
			const path = getPath(request)

			if (hasParams) {
				const queryString = getQueryParams(request.url)

				return { path: path, searchParams: queryString }
			}

			return path
		},
	},
]

for (const route of routes) {
	group(route.request.url, () => {
		for (const { fn, name } of extracters) {
			bench(name, async () => {
				fn(route)
			})
		}
	})
}

group('all routes together', () => {
	for (const { fn, name } of extracters) {
		bench(name, async () => {
			for (const route of routes) {
				fn(route)
			}
		})
	}
})

await run()
