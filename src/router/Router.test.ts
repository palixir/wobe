import { describe, expect, it } from 'bun:test'
import { Router } from './Router'

describe('Wobe router', () => {
	it('should compile a simple route', () => {
		const route = '/a/simple/route/'

		const router = new Router()

		router.compile([route])

		expect(router.root.path).toBe('/')
		expect(router.root.children[0].path).toBe('a/')
		expect(router.root.children[0].children[0].path).toBe('simple/')
		expect(router.root.children[0].children[0].children[0].path).toBe(
			'route/',
		)
	})

	it('should compile a simple route without wildcard at the end', () => {
		const route = '/a/simple/route'

		const router = new Router()

		router.compile([route])

		expect(router.root.path).toBe('/')
		expect(router.root.children[0].path).toBe('a/')
		expect(router.root.children[0].children[0].path).toBe('simple/')
		expect(router.root.children[0].children[0].children[0].path).toBe(
			'route',
		)
	})

	it('should compile a simple route without the wildward at the begining', () => {
		const route = 'a/simple/route'

		const router = new Router()

		router.compile([route])

		expect(router.root.path).toBe('/')
		expect(router.root.children[0].path).toBe('a/')
		expect(router.root.children[0].children[0].path).toBe('simple/')
		expect(router.root.children[0].children[0].children[0].path).toBe(
			'route',
		)
	})

	it('should compile a simple route ending by *', () => {
		const route = 'a/simple/route/*'

		const router = new Router()

		router.compile([route])

		expect(router.root.path).toBe('/')
		expect(router.root.children[0].path).toBe('a/')
		expect(router.root.children[0].children[0].path).toBe('simple/')
		expect(router.root.children[0].children[0].children[0].path).toBe(
			'route/',
		)
	})

	it('should find a simple route', () => {
		const route = '/a/simple/route'

		const router = new Router()

		router.compile([route])

		const foundedRoute = router.find('/a/simple/route')

		expect(foundedRoute?.path).toBe('/route')
	})
})
