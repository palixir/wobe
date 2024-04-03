export const handler = () => {}

export type Route = {
	name: string
	method: 'GET' | 'POST'
	pathToCompile: string
	path: string
	handler: () => void
}

export interface RouterInterface {
	name: string
	match: (route: Route) => unknown
}

export const routes: Route[] = [
	{
		name: 'short static',
		method: 'GET',
		pathToCompile: '/user',
		path: '/user',
		handler,
	},
	{
		name: 'static with same radix',
		method: 'GET',
		pathToCompile: '/user/comments',
		path: '/user/comments',
		handler,
	},
	{
		name: 'dynamic route',
		method: 'GET',
		pathToCompile: '/user/lookup/username/:username',
		path: '/user/lookup/username/hey',
		handler,
	},
	{
		name: 'mixed static dynamic',
		method: 'GET',
		pathToCompile: '/event/:id/comments',
		path: '/event/abcd1234/comments',
		handler,
	},
	{
		name: 'post',
		method: 'POST',
		pathToCompile: '/event/:id/comment',
		path: '/event/abcd1234/comment',
		handler,
	},
	{
		name: 'long static',
		method: 'GET',
		pathToCompile: '/very/deeply/nested/route/hello/there',
		path: '/very/deeply/nested/route/hello/there',
		handler,
	},
	{
		name: 'wildcard',
		method: 'GET',
		pathToCompile: '/static/*',
		path: '/static/index.html',
		handler,
	},
]
