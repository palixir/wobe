import { describe, expect, it } from 'bun:test'
import { Router } from './Router'

describe('Wobe router', () => {
	it('should compile a simple route', () => {
		const route = '/a/simple/route/'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route without wildcard at the end', () => {
		const route = '/a/simple/route'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route without the wildward at the begining', () => {
		const route = 'a/simple/route'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a simple route ending by *', () => {
		const route = 'a/simple/route/*'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('a')
		expect(router.root.children[0].children[0].name).toBe('simple')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'route',
		)
	})

	it('should compile a route with a parameter', () => {
		const route = 'user/:id'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe('id')
	})

	it('should compile a route with a parameter and children', () => {
		const route = 'user/:id/profile'

		const router = new Router()

		router.compile([route])

		expect(router.root.name).toBe('/')
		expect(router.root.children[0].name).toBe('user')
		expect(router.root.children[0].children[0].name).toBe('id')
		expect(router.root.children[0].children[0].children[0].name).toBe(
			'profile',
		)
	})

	it('should find a simple route', () => {
		const route = '/a/simple/route'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')
	})

	it('should find a simple route ending by wildcard', () => {
		const route = '/a/simple/route/'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')
	})

	it('should find a simple route ending with *', () => {
		const route = '/a/simple/route/*'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.name).toBe('route')

		const foundedRouteWithAsterix = router.find('/a/simple/route/*')

		expect(foundedRouteWithAsterix?.name).toBe('route')
	})

	it("should not a find a route that doesn't exist", () => {
		const route = '/a/simple/route/'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/a/route/that/does/not/exist')

		expect(foundedRoute).toBeUndefined()
	})

	it.only('should find a route with a dynamic parameter', () => {
		const route = '/user/:id'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/user/123')

		expect(foundedRoute?.name).toBe('user')
	})
})
