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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe(':id')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe(':id')
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
			).toBe(':id')
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.children[0].name,
			).toBe('test2')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')

			expect(radixTree.root.children[1].name).toBe('a2')
			expect(radixTree.root.children[1].method).toBeUndefined()
			expect(radixTree.root.children[1].handler).toBeUndefined()
			expect(radixTree.root.children[1].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[1].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[1].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[1].children[0].children[0].name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('*')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('*')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].children[0]
					.name,
			).toBe('route')
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
			expect(radixTree.root.children[0].children[0].name).toBe('simple')
			expect(
				radixTree.root.children[0].children[0].method,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].handler,
			).toBeUndefined()
			expect(
				radixTree.root.children[0].children[0].children[0].name,
			).toBe('route')
			expect(
				radixTree.root.children[0].children[0].children[0].method,
			).toBe('GET')
			expect(
				radixTree.root.children[0].children[0].children[0].handler,
			).toBeDefined()
		})
	})

	describe('findRoute', () => {
		it.only('should find a route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route?.handler).toBeDefined()
		})

		it('should find a route with a wildcard', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

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

			expect(route).toBeDefined()
			expect(route.handler).toBeDefined()
		})

		it('should find a route with a wildcard at the end', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/*', () => Promise.resolve())

			const route = radixTree.findRoute('GET', '/a/simple/route')

			expect(route).toBeDefined()
			expect(route.handler).toBeDefined()
		})

		it('should not find a route', () => {
			const radixTree = new RadixTree()

			radixTree.addRoute('GET', '/a/simple/route', () =>
				Promise.resolve(),
			)

			const route = radixTree.findRoute('GET', '/a/simple/route/route')

			expect(route).toBeUndefined()
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

			expect(radixTree.root.children[0].name).toBe('route')
			expect(radixTree.root.children[0].method).toBe('GET')
			expect(radixTree.root.children[0].handler).toBeDefined()

			expect(radixTree.root.children[1].name).toBe('route')
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

			expect(radixTree.root.name).toBe('/a/:id/route')
			expect(radixTree.root.method).toBe('GET')
			expect(radixTree.root.handler).toBeDefined()
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
				'a/complex/route/next2',
			)
			expect(radixTree.root.children[0].method).toBe('GET')
			expect(radixTree.root.children[0].handler).toBeDefined()

			expect(radixTree.root.children[1].name).toBe('a2/complex/route')
			expect(radixTree.root.children[1].method).toBeUndefined()
			expect(radixTree.root.children[1].handler).toBeUndefined()
			expect(radixTree.root.children[1].children[0].name).toBe('next2')
			expect(radixTree.root.children[1].children[0].method).toBe('POST')
			expect(radixTree.root.children[1].children[0].handler).toBeDefined()
			expect(radixTree.root.children[1].children[1].name).toBe('next3')
			expect(radixTree.root.children[1].children[1].method).toBe('POST')
			expect(radixTree.root.children[1].children[1].handler).toBeDefined()
		})
	})
})
