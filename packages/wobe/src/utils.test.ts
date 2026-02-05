import { describe, expect, it } from 'bun:test'
import { extractPathnameAndSearchParams } from './utils'

describe('Utils', () => {
	describe('extractPathnameAndSearchParams', () => {
		it('should extract pathname from a route with http', () => {
			const route = 'http://localhost:3000/test'
			const { pathName } = extractPathnameAndSearchParams(route)
			expect(pathName).toBe('/test')
		})

		it('should extract pathname from a route with https', () => {
			const route = 'https://localhost:3000/test'
			const { pathName } = extractPathnameAndSearchParams(route)
			expect(pathName).toBe('/test')
		})

		it('should extract pathname from a route', () => {
			const route = 'http://localhost:3000/'
			const { pathName } = extractPathnameAndSearchParams(route)
			expect(pathName).toBe('/')
		})

		it('should extract pathname with sub pathname from a route', () => {
			const route = 'http://localhost:3000/test/subtest'
			const { pathName } = extractPathnameAndSearchParams(route)
			expect(pathName).toBe('/test/subtest')
		})

		it('should extract single search param from a route', () => {
			const route = 'http://localhost:3000/test?name=John'
			const { pathName, searchParams } = extractPathnameAndSearchParams(route)

			expect(pathName).toBe('/test')
			expect(searchParams).toEqual({ name: 'John' })
		})

		it('should extract search params from a route', () => {
			const route = 'http://localhost:3000/test?name=John&age=30'
			const { pathName, searchParams } = extractPathnameAndSearchParams(route)

			expect(pathName).toBe('/test')
			expect(searchParams).toEqual({ name: 'John', age: '30' })
		})

		it('should extract search params from a complex route', () => {
			const route =
				'http://localhost:3000/test?name=John&age=30&firstName=Pierre-Jacques&Country=Pays basque'
			const { pathName, searchParams } = extractPathnameAndSearchParams(route)

			expect(pathName).toBe('/test')
			expect(searchParams).toEqual({
				name: 'John',
				age: '30',
				firstName: 'Pierre-Jacques',
				Country: 'Pays basque',
			})
		})
	})
})
