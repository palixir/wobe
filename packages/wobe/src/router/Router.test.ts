import { describe, expect, it } from 'bun:test'
import { Router } from './Router'

describe('Wobe router', () => {
	describe.only('Router - CompileV2', () => {
		it('should compile a simple route', () => {
			const router = new Router()

			router.compileV2([
				{ path: '/a/simple/route/', method: 'GET', handler: () => {} },
				{ path: '/a/simple/route2/', method: 'GET', handler: () => {} },
				{ path: '/a/simple2/route/', method: 'GET', handler: () => {} },
			])
		})
	})

	describe('Router - Compile', () => {
		it('should compile a simple route', () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route/', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('a')
			expect(router.root.children[0].children[0].name).toBe('simple')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'route',
			)

			console.log(router.toStringNode(router.root))
		})

		it('should compile a simple route without slash at the end', () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('a')
			expect(router.root.children[0].children[0].name).toBe('simple')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'route',
			)
		})

		it('should compile a simple route without the slash at the begining', () => {
			const router = new Router()

			router.compile([
				{ path: 'a/simple/route', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('a')
			expect(router.root.children[0].children[0].name).toBe('simple')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'route',
			)
		})

		it('should compile a route with * at the middle of the path and any path after', () => {
			const router = new Router()

			router.compile([
				{
					path: '/a/simple/route/*/v1',
					method: 'GET',
					handler: () => {},
				},
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('a')
			expect(router.root.children[0].children[0].name).toBe('simple')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'route',
			)
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('*')
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.children[0].name,
			).toBe('v1')
		})

		it('should compile a simple route ending by *', () => {
			const router = new Router()

			router.compile([
				{ path: 'a/simple/route/*', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('a')
			expect(router.root.children[0].children[0].name).toBe('simple')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'route',
			)
		})

		it('should compile a route with a parameter', () => {
			const router = new Router()

			router.compile([
				{ path: 'user/:id', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('user')
			expect(router.root.children[0].children[0].name).toBe(':id')
		})

		it('should compile a route with a parameter and children', () => {
			const router = new Router()

			router.compile([
				{ path: 'user/:id/profile', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('user')
			expect(router.root.children[0].children[0].name).toBe(':id')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'profile',
			)
		})

		it('should compile a route with a parameter and children (ending with slash)', () => {
			const router = new Router()

			router.compile([
				{ path: 'user/:id/profile/', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('user')
			expect(router.root.children[0].children[0].name).toBe(':id')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'profile',
			)
		})

		it('should compile multiple route', () => {
			const router = new Router()

			router.compile([
				{ path: 'user/:id/profile/', method: 'GET', handler: () => {} },
				{ path: '/another/route', method: 'GET', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('user')
			expect(router.root.children[0].children[0].name).toBe(':id')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'profile',
			)

			expect(router.root.children[1].name).toBe('another')
			expect(router.root.children[1].children[0].name).toBe('route')
		})

		it('should compile multiple route with dynamic parameters', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
				{
					path: '/user/:id/profile/:section/section/:subsection/info2',
					method: 'GET',
					handler: () => {},
				},
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('user')
			expect(router.root.children[0].children[0].name).toBe(':id')
			expect(router.root.children[0].children[0].children[0].name).toBe(
				'profile',
			)
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe(':section')
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.children[0].name,
			).toBe('section')
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.children[0].children[0].name,
			).toBe(':subsection')
			expect(
				router.root.children[0].children[0].children[0].children[0]
					.children[0].children[0].children[0].name,
			).toBe('info')

			expect(
				router.root.children[0].children[0].children[0].children[0]
					.children[0].children[0].children[1].name,
			).toBe('info2')
		})

		it('should not compile route with same element in dynamic and static parameters', () => {
			const router = new Router()

			expect(() =>
				router.compile([
					{
						path: '/user/:id/profile/:section/section/:subsection/info',
						method: 'GET',
						handler: () => {},
					},
					{
						path: '/user/:id/profile/:section/section/:subsection/info2',
						method: 'GET',
						handler: () => {},
					},
					{
						path: '/user/id/information',
						method: 'GET',
						handler: () => {},
					},
				]),
			).toThrow('Route already exist with the ":id" parameter')
		})

		it('should compile a route with http method', () => {
			const router = new Router()

			router.compile([
				{ path: '/same/route', method: 'GET', handler: () => {} },
				{ path: '/same/route', method: 'POST', handler: () => {} },
			])

			expect(router.root.name).toBe('/')
			expect(router.root.children[0].name).toBe('same')
			expect(router.root.children[0].children[0].name).toBe('route')
			expect(router.root.children[0].children[0].method).toBe('GET')

			expect(router.root.children[0].children[1].name).toBe('route')
			expect(router.root.children[0].children[1].method).toBe('POST')
		})
	})

	describe('Router - Find', () => {
		it('should find a simple route', () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/a/simple/route',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('route')
		})

		it('should find a simple route ending by slash', () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route/', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/a/simple/route',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('route')
		})

		it('should find a route with * in the middle and any path after', () => {
			const router = new Router()

			router.compile([
				{
					path: '/a/simple/route/*/v1',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/a/simple/route/ANYSTRING/v1',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('v1')
		})

		it('should find a simple route ending with *', () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route/*', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/a/simple/route',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('route')

			const foundedRouteWithAsterix = router.find({
				path: '/a/simple/route/*',
				method: 'GET',
			})

			expect(foundedRouteWithAsterix?.name).toBe('route')
		})

		it("should not a find a route that doesn't exist", () => {
			const router = new Router()

			router.compile([
				{ path: '/a/simple/route/', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/a/route/that/does/not/exist',
				method: 'GET',
			})

			expect(foundedRoute).toBeUndefined()
		})

		it('should find a route with a dynamic parameter', () => {
			const router = new Router()

			router.compile([
				{ path: '/user/:id', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/user/123',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe(':id')
		})

		it('should find a route with a dynamic parameter and a route after the parameter', () => {
			const router = new Router()

			router.compile([
				{ path: '/user/:id/profile', method: 'GET', handler: () => {} },
			])

			const foundedRoute = router.find({
				path: '/user/123/profile',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('profile')
		})

		it('should find a route with a dynamic parameter and a route after the parameter (ending by slash)', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('profile')
		})

		it('should find a route with many dynamic parameters', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile/456/section/789/info',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('info')
		})

		it('should find an a part of a route with many dynamic parameters', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile/456/section',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('section')
		})

		it('should not find a route that not exist with many dynamic parameters', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/notexist/123/profile/456/section',
				method: 'GET',
			})

			expect(foundedRoute).toBeUndefined()
		})

		it('should find a route with multiple route in router', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
				{
					path: '/user/:id/profile/:section/section/:subsection/info2',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile/456/section/789/info',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('info')

			const foundedRoute2 = router.find({
				path: '/user/123/profile/456/section/789/info2',
				method: 'GET',
			})

			expect(foundedRoute2?.name).toBe('info2')
		})

		it('should find a route with difference name in the route', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
				{
					path: '/user/:id/profile/:section/section2/:subsection/info2',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile/456/section/789/info',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('info')

			const foundedRoute2 = router.find({
				path: '/user/123/profile/456/section2/789/info2',
				method: 'GET',
			})

			expect(foundedRoute2?.name).toBe('info2')
		})

		// Here we supose that a dynamic parameter is mandory when specified in the route
		it('should not find a route with missing dynamic parameter', () => {
			const router = new Router()

			router.compile([
				{
					path: '/user/:id/profile/:section/section/:subsection/info',
					method: 'GET',
					handler: () => {},
				},
				{
					path: '/user/:id/profile/:section/section/:subsection/info2',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/user/123/profile/456/section//info',
				method: 'GET',
			})

			expect(foundedRoute).toBeUndefined()
		})

		it('should find a route by http method', () => {
			const router = new Router()

			router.compile([
				{
					path: '/same/route',
					method: 'GET',
					handler: () => {},
				},
				{
					path: '/same/route',
					method: 'POST',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: '/same/route',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('route')
			expect(foundedRoute?.method).toBe('GET')

			const foundedRoute2 = router.find({
				path: '/same/route',
				method: 'POST',
			})

			expect(foundedRoute2?.name).toBe('route')
			expect(foundedRoute2?.method).toBe('POST')
		})

		it('should find a route if there is no slash at the begining', () => {
			const router = new Router()

			router.compile([
				{
					path: '/same/route',
					method: 'GET',
					handler: () => {},
				},
			])

			const foundedRoute = router.find({
				path: 'same/route',
				method: 'GET',
			})

			expect(foundedRoute?.name).toBe('route')
			expect(foundedRoute?.method).toBe('GET')
		})
	})

	describe('Router - isMiddlewarePathnameMatchWithRoute', () => {
		it('should match between a simple route and a simple pathname', () => {
			const router = new Router()

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v2',
				}),
			).toEqual(false)
		})

		it('should match if there is a / at the end of the route or middleware pathname', () => {
			const router = new Router()

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1/',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1//',
				}),
			).toEqual(false)
		})

		it('should not match if the middleware pathname is shorter than the route', () => {
			const router = new Router()

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/',
				}),
			).toEqual(false)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test',
				}),
			).toEqual(false)
		})

		it('should match between a route and a pathname with wildcard at the end of middleware pathname', () => {
			const router = new Router()

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/*',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1/*',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1/*/',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1/*',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1/',
					middlewarePathname: '/test/a/v1/*',
				}),
			).toEqual(true)
		})

		it('should match when a wildcard is in the middle of the middleware pathname', () => {
			const router = new Router()

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/a/v1/*/v2',
				}),
			).toEqual(false)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1/X/v3',
					middlewarePathname: '/test/a/v1/*/v2',
				}),
			).toEqual(false)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/*/v2',
				}),
			).toEqual(false)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/*/v1',
				}),
			).toEqual(true)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1',
					middlewarePathname: '/test/*/v2',
				}),
			).toEqual(false)

			expect(
				router.isMiddlewarePathnameMatchWithRoute({
					route: '/test/a/v1/X/v2',
					middlewarePathname: '/test/a/v1/*/v2',
				}),
			).toEqual(true)
		})
	})
})
