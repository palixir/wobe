import { describe, expect, it } from 'bun:test'
import { RadixTree } from './RadixTree'

describe('RadixTree', () => {
	describe('addRoute', () => {
		it('should add a route to the radix tree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeDefined()
		})

		it('should add a route to the radix tree with no slash at the begining', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', 'a/simple/route/', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeDefined()
		})

		it('should add a route to the radix tree with slash at the end', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route/', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeDefined()
		})

		it('should add a route to the radix tree with param', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route/:id', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('/:id')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.method,
			).toBe('GET')

			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.isParameterNode,
			).toBe(true)
		})

		it('should add two routes to the radix tree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/a/simple/route', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children.length).toBe(1)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[1].method,
			).toBe('POST')
		})

		it('should add two routes to the radix tree with param', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route/:id', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('GET', '/a/simple/route/:id/test2/', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('/:id')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.isParameterNode,
			).toBe(true)

			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('/:id')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.children[0].name,
			).toBe('/test2')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.method,
			).toBe('GET')
		})

		it('should add two routes to the radix tree with diffent radix', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/a2/simple/route', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children.length).toBe(2)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')

			expect(radixTree.root.children[1].name).toBe('a2')
			expect(radixTree.root.children[1].method).toBeUndefined()
			expect(radixTree.root.children[1].handler).toBeUndefined()
			expect(radixTree.root.children[1].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[1].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[1].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[1].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[1].children[0].children[0].method,
			).toBe('POST')
		})

		it('should add a route with a wildcard at the end', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')

			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()

			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/*')
			expect(
				radixTree.root.children[0].children[0].children[0]
					.isWildcardNode,
			).toBeTrue()
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
		})

		it('should add a route with a wildcard at the middle', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*/route', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].isWildcardNode).toBeFalse()

			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()

			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/*')
			expect(
				radixTree.root.children[0].children[0].children[0]
					.isWildcardNode,
			).toBeTrue()
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()

			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.handler,
			).toBeDefined()
		})

		it('should not add a route if already exist', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			expect(radixTree.root.children.length).toBe(1)

			expect(radixTree.root.children[0].name).toBe('a')
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()
			expect(radixTree.root.children[0].children[0].name).toBe('/simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('/route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeDefined()
		})
	})

	describe('findRoute', () => {
		it('should find a route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should not find a route that not exist', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple')
			const route2 = radixTree.findRoute('GET', '/a/simple/route/bigger')

			expect(route).toBeNull()
			expect(route2).toBeNull()
		})

		it('should find a route ending with a slash', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route/', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route/')
			const route2 = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()
		})

		it('should find a route by method', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('POST', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.method).toBe('POST')
			expect(route?.handler).toBeDefined()
		})

		it('should find a complex route by method', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute(
				'GET',
				'/there/is/a/very/long/and/complex/route',
				() => Promise.resolve(),
			)
			radixTree.addRoute(
				'GET',
				'/there/is/a/very/long/and/complex/route2',
				() => Promise.resolve(),
			)
			radixTree.addRoute(
				'POST',
				'/there/is/a/very/long/and/complex/addRoute',
				() => Promise.resolve(),
			)

			const route = radixTree.findRoute(
				'GET',
				'/there/is/a/very/long/and/complex/route',
			)

			const route2 = radixTree.findRoute(
				'GET',
				'/there/is/a/very/long/and/complex/route2',
			)

			const route3 = radixTree.findRoute(
				'POST',
				'/there/is/a/very/long/and/complex/addRoute',
			)

			const invalidRoute = radixTree.findRoute(
				'POST',
				'/there/is/a/very/long/and/complex/route',
			)

			expect(route).toBeDefined()
			expect(route?.method).toBe('GET')
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.method).toBe('GET')
			expect(route2?.handler).toBeDefined()

			expect(route3).toBeDefined()
			expect(route3?.method).toBe('POST')
			expect(route3?.handler).toBeDefined()

			expect(invalidRoute).toBeNull()
		})

		it('should find a route with a parameter at the end of the route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id', () => Promise.resolve())

			const route = radixTree.findRoute('GET', '/a/1/')
			const route2 = radixTree.findRoute('GET', '/a/1')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()
		})

		it('should find a route with parameter after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/route', () => Promise.resolve())
			radixTree.addRoute('GET', '/a/:id/route2', () => Promise.resolve())

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/1/route')
			const route2 = radixTree.findRoute('GET', '/a/1/route2')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()
		})

		it('should find a route ending by */', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route/*/', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route with many parameters', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/:name/:age', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/1/john/30')
			const invalidRoute = radixTree.findRoute('GET', '/a/1/john')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(invalidRoute).toBeNull()
		})

		it('should find a route with many parameters after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/:name/:age', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/1/john/30')
			const invalidRoute = radixTree.findRoute('GET', '/a/1/john')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(invalidRoute).toBeNull()
		})

		it('should find a route with a parameter at the middle of the route with different size (:id has length 3, and 1 is only one)', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/route', () => Promise.resolve())

			const route = radixTree.findRoute('GET', '/a/1/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route with a parameter at the middle of the route with same size (:id has length 3, and 123 is also 3)', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/route', () => Promise.resolve())

			const route = radixTree.findRoute('GET', '/a/123/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route with a wildcard', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

			const route = radixTree.findRoute('GET', '/a/simple/route')
			const route2 = radixTree.findRoute('GET', '/a/simple/route/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()
		})

		it('should find a route with multiple wildcards', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*/*/*/', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route')
			const route2 = radixTree.findRoute('GET', '/a/simple/route/route')
			const route3 = radixTree.findRoute(
				'GET',
				'/a/simple/route/route/again/another/route',
			)

			expect(route).toBeDefined()
			expect(route?.method).toBe('GET')
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.method).toBe('GET')
			expect(route2?.handler).toBeDefined()

			expect(route3).toBeDefined()
			expect(route3?.method).toBe('GET')
			expect(route3?.handler).toBeDefined()
		})

		it('should find a route with a wildcard at the end after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route with a wildcard at the middle', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route/route')
			const route2 = radixTree.findRoute('GET', '/a/simple/another/route')
			const invalidRoute = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()

			expect(invalidRoute).toBeNull()
		})

		it('should find a route with a wildcard at the middle after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*/route', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/simple/route/route')
			const route2 = radixTree.findRoute('GET', '/a/simple/another/route')
			const invalidRoute = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()

			expect(route2).toBeDefined()
			expect(route2?.handler).toBeDefined()

			expect(invalidRoute).toBeNull()
		})

		it('should not find a non existing route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route/route')

			expect(route).toBeNull()
		})

		it('should not find a non existing route after an optimizeTree', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			const route = radixTree.findRoute('GET', '/a/simple/route/route')

			expect(route).toBeNull()
		})
	})

	describe('optimizeTree', () => {
		it('should optimize a tree by merging all the node with only one child', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/a/simple/route', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			expect(radixTree.root.name).toBe('/a/simple')
			expect(radixTree.root.method).toBeUndefined()
			expect(radixTree.root.handler).toBeUndefined()

			expect(radixTree.root.children[0].name).toBe('/route')
			expect(radixTree.root.children[0].method).toBe('GET')
			expect(radixTree.root.children[0].handler).toBeDefined()

			expect(radixTree.root.children[1].name).toBe('/route')
			expect(radixTree.root.children[1].method).toBe('POST')
			expect(radixTree.root.children[1].handler).toBeDefined()
		})

		it('should merge a tree when there is only one route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			expect(radixTree.root.name).toBe('/a/simple/route')
			expect(radixTree.root.method).toBe('GET')
			expect(radixTree.root.handler).toBeDefined()
		})

		it('should merge a tree with parametric node', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/:id/route', () => Promise.resolve())

			radixTree.optimizeTree()

			expect(radixTree.root.name).toBe('/a')
			expect(radixTree.root.method).toBeUndefined()
			expect(radixTree.root.handler).toBeUndefined()

			expect(radixTree.root.children[0].name).toBe('/:id')
			expect(radixTree.root.children[0].isParameterNode).toBeTrue()
			expect(radixTree.root.children[0].method).toBeUndefined()
			expect(radixTree.root.children[0].handler).toBeUndefined()

			expect(radixTree.root.children[0].children[0].name).toBe('/route')
			expect(radixTree.root.children[0].children[0].method).toBe('GET')
			expect(radixTree.root.children[0].children[0].handler).toBeDefined()
		})

		it('should correctly merge a tree with a wildcard', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

			radixTree.optimizeTree()

			expect(radixTree.root.name).toBe('/a/simple')
			expect(radixTree.root.method).toBeUndefined()
			expect(radixTree.root.handler).toBeUndefined()

			expect(radixTree.root.children[0].name).toBe('/*')
			expect(radixTree.root.children[0].isWildcardNode).toBeTrue()
			expect(radixTree.root.children[0].method).toBe('GET')
			expect(radixTree.root.children[0].handler).toBeDefined()
		})

		it('should merge a tree with complex structure', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/there/is/a/complex/route/next2', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/there/is/a2/complex/route/next2', () =>
				Promise.resolve(),
			)
			radixTree.addRoute('POST', '/there/is/a2/complex/route/next3', () =>
				Promise.resolve(),
			)

			radixTree.optimizeTree()

			expect(radixTree.root.name).toBe('/there/is')
			expect(radixTree.root.method).toBeUndefined()
			expect(radixTree.root.handler).toBeUndefined()

			expect(radixTree.root.children[0].name).toBe(
				'/a/complex/route/next2',
			)
			expect(radixTree.root.children[0].method).toBe('GET')
			expect(radixTree.root.children[0].handler).toBeDefined()

			expect(radixTree.root.children[1].name).toBe('/a2/complex/route')
			expect(radixTree.root.children[1].method).toBeUndefined()
			expect(radixTree.root.children[1].handler).toBeUndefined()
			expect(radixTree.root.children[1].children[0].name).toBe('/next2')
			expect(radixTree.root.children[1].children[0].method).toBe('POST')
			expect(radixTree.root.children[1].children[0].handler).toBeDefined()
			expect(radixTree.root.children[1].children[1].name).toBe('/next3')
			expect(radixTree.root.children[1].children[1].method).toBe('POST')
			expect(radixTree.root.children[1].children[1].handler).toBeDefined()
		})
	})
})
