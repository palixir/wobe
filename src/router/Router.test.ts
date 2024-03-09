import { describe, expect, it } from 'bun:test'
import { Router } from './Router'

describe('Wobe router', () => {
	it('should compile a simple route', () => {
		const router = new Router()

		router.compile(['/a/simple/route/'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route without slash at the end', () => {
		const router = new Router()

		router.compile(['/a/simple/route'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route without the slash at the begining', () => {
		const router = new Router()

		router.compile(['a/simple/route'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route ending by *', () => {
		const router = new Router()

		router.compile(['a/simple/route/*'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a route with a parameter', () => {
		const router = new Router()

		router.compile(['user/:id'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe(':id')
	})

	it('should compile a route with a parameter and children', () => {
		const router = new Router()

		router.compile(['user/:id/profile'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe(':id')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'profile',
		)
	})

	it('should compile a route with a parameter and children (ending with slash)', () => {
		const router = new Router()

		router.compile(['user/:id/profile/'])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe(':id')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'profile',
		)
	})

	it('should compile multiple route', () => {
		const router = new Router()

		router.compile(['user/:id/profile/', '/another/route'])

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
			'/user/:id/profile/:section/section/:subsection/info',
			'/user/:id/profile/:section/section/:subsection/info2',
		])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe(':id')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'profile',
		)
		expect(
			router.root.children[0].children[0].children[0].children[0].name,
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
				'/user/:id/profile/:section/section/:subsection/info',
				'/user/:id/profile/:section/section/:subsection/info2',
				'/user/id/information',
			]),
		).toThrow('Route already exist with the ":id" parameter')
	})

	it('should find a simple route', () => {
		const router = new Router()

		router.compile(['/a/simple/route'])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')
	})

	it('should find a simple route ending by slash', () => {
		const router = new Router()

		router.compile(['/a/simple/route/'])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')
	})

	it('should find a simple route ending with *', () => {
		const router = new Router()

		router.compile(['/a/simple/route/*'])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')

		const foundedRouteWithAsterix = router.find('/a/simple/route/*')

		expect(foundedRouteWithAsterix?.name).toBe('route')
	})

	it("should not a find a route that doesn't exist", () => {
		const router = new Router()

		router.compile(['/a/simple/route/'])

		const foundedRoute = router.find('/a/route/that/does/not/exist')

		expect(foundedRoute).toBeUndefined()
	})

	it('should find a route with a dynamic parameter', () => {
		const router = new Router()

		router.compile(['/user/:id'])

		const foundedRoute = router.find('/user/123')

		expect(foundedRoute?.name).toBe(':id')
	})

	it('should find a route with a dynamic parameter and a route after the parameter', () => {
		const router = new Router()

		router.compile(['/user/:id/profile'])

		const foundedRoute = router.find('/user/123/profile')

		expect(foundedRoute?.name).toBe('profile')
	})

	it('should find a route with a dynamic parameter and a route after the parameter (ending by slash)', () => {
		const router = new Router()

		router.compile(['/user/:id/profile/'])

		const foundedRoute = router.find('/user/123/profile')

		expect(foundedRoute?.name).toBe('profile')
	})

	it('should find a route with many dynamic parameters', () => {
		const router = new Router()

		router.compile(['/user/:id/profile/:section/section/:subsection/info'])

		const foundedRoute = router.find(
			'/user/123/profile/456/section/789/info',
		)

		expect(foundedRoute?.name).toBe('info')
	})

	it('should find an a part of a route with many dynamic parameters', () => {
		const router = new Router()

		router.compile(['/user/:id/profile/:section/section/:subsection/info'])

		const foundedRoute = router.find('/user/123/profile/456/section')

		expect(foundedRoute?.name).toBe('section')
	})

	it('should not find a route that not exist with many dynamic parameters', () => {
		const router = new Router()

		router.compile(['/user/:id/profile/:section/section/:subsection/info'])

		const foundedRoute = router.find('/notexist/123/profile/456/section')

		expect(foundedRoute).toBeUndefined()
	})

	it('should find a route with multiple route in router', () => {
		const router = new Router()

		router.compile([
			'/user/:id/profile/:section/section/:subsection/info',
			'/user/:id/profile/:section/section/:subsection/info2',
		])

		const foundedRoute = router.find(
			'/user/123/profile/456/section/789/info',
		)

		expect(foundedRoute?.name).toBe('info')

		const foundedRoute2 = router.find(
			'/user/123/profile/456/section/789/info2',
		)

		expect(foundedRoute2?.name).toBe('info2')
	})

	it('should find a route with difference name in the route', () => {
		const router = new Router()

		router.compile([
			'/user/:id/profile/:section/section/:subsection/info',
			'/user/:id/profile/:section/section2/:subsection/info2',
		])

		const foundedRoute = router.find(
			'/user/123/profile/456/section/789/info',
		)

		expect(foundedRoute?.name).toBe('info')

		const foundedRoute2 = router.find(
			'/user/123/profile/456/section2/789/info2',
		)

		expect(foundedRoute2?.name).toBe('info2')
	})

	// Here we supose that a dynamic parameter is mandory when specified in the route
	it('should not find a route with missing dynamic parameter', () => {
		const router = new Router()

		router.compile([
			'/user/:id/profile/:section/section/:subsection/info',
			'/user/:id/profile/:section/section/:subsection/info2',
		])

		const foundedRoute = router.find('/user/123/profile/456/section//info')

		expect(foundedRoute).toBeUndefined()
	})
})
