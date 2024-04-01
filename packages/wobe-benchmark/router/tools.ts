export const handler = () => {}

export type Route = {
	name: string
	method: 'GET' | 'POST'
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
		path: '/user',
		handler,
	},
	{
		name: 'static with same radix',
		method: 'GET',
		path: '/user/comments',
		handler,
	},
	// {
	// 	name: 'dynamic route',
	// 	method: 'GET',
	// 	path: '/user/lookup/username/hey',
	// 	handler,
	// },
	// {
	// 	name: 'mixed static dynamic',
	// 	method: 'GET',
	// 	path: '/event/abcd1234/comments',
	// 	handler,
	// },
	// {
	// 	name: 'post',
	// 	method: 'POST',
	// 	path: '/event/abcd1234/comment',
	// 	handler,
	// },
	// {
	// 	name: 'long static',
	// 	method: 'GET',
	// 	path: '/very/deeply/nested/route/hello/there',
	// 	handler,
	// },
	// {
	// 	name: 'wildcard',
	// 	method: 'GET',
	// 	path: '/static/index.html',
	// 	handler,
	// },
]
