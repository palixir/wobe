import { describe, expect, it, beforeEach } from 'bun:test'
import { html } from './html'
import { WobeResponse } from '../WobeResponse'
import { join } from 'path'
import { rm, mkdir, writeFile } from 'node:fs/promises'

// Mock context object
class MockContext {
	request: Request
	res: WobeResponse

	constructor(request: Request) {
		this.request = request
		this.res = new WobeResponse(request)
	}
}

describe('html', () => {
	const TEST_DIR = './test_static_files'
	const rootPath = join(process.cwd(), TEST_DIR)

	// Setup test directory and files
	beforeEach(async () => {
		await rm(TEST_DIR, { recursive: true, force: true })
		await mkdir(TEST_DIR, { recursive: true })

		// Create test files
		await writeFile(join(TEST_DIR, 'index.html'), '<html>Index</html>')
		await writeFile(join(TEST_DIR, 'test.html'), '<html>Test</html>')
		await writeFile(join(TEST_DIR, 'styles.css'), 'body { color: red; }')
		await writeFile(join(TEST_DIR, 'script.js'), 'console.log("test")')
		await writeFile(join(TEST_DIR, 'data.json'), '{"test": true}')

		// Create a subdirectory with index.html
		await mkdir(join(TEST_DIR, 'subdir'), { recursive: true })
		await writeFile(
			join(TEST_DIR, 'subdir', 'index.html'),
			'<html>Subdir</html>',
		)
	})

	it('should serve HTML files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/test.html')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Test')
	})

	it('should serve CSS files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/styles.css')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/css')
		expect(await response?.text()).toContain('body { color: red; }')
	})

	it('should serve JS files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/script.js')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe(
			'application/javascript',
		)
		expect(await response?.text()).toContain('console.log("test")')
	})

	it('should serve JSON files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/data.json')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('application/json')
		expect(await response?.text()).toContain('"test": true')
	})

	it('should serve index.html when directory is requested', async () => {
		const request = new Request('http://localhost:3000/subdir/')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Subdir')
	})

	it('should return 404 for non-existent files', async () => {
		const request = new Request('http://localhost:3000/nonexistent.html')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(404)
		expect(await response?.text()).toBe('Not Found')
	})

	it('should serve fallback file for SPA when file not found', async () => {
		const request = new Request('http://localhost:3000/nonexistent')
		const ctx = new MockContext(request)
		const middleware = html(rootPath, 'index.html')

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Index')
	})

	it('should return 404 when fallback file does not exist', async () => {
		const request = new Request('http://localhost:3000/nonexistent')
		const ctx = new MockContext(request)
		const middleware = html(rootPath, 'nonexistent-fallback.html')

		const response = await middleware(ctx)
		expect(response?.status).toBe(404)
		expect(await response?.text()).toBe('Not Found')
	})

	it.only('should handle URL-encoded paths', async () => {
		// Create a file with spaces in the name
		await writeFile(
			join(TEST_DIR, 'file with spaces.html'),
			'<html>Spaces</html>',
		)

		const request = new Request(
			'http://localhost:3000/file%20with%20spaces.html',
		)
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Spaces')
	})

	it('should handle files with no extension', async () => {
		await writeFile(join(TEST_DIR, 'noextension'), 'No extension content')

		const request = new Request('http://localhost:3000/noextension')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe(
			'application/octet-stream',
		)
		expect(await response?.text()).toContain('No extension content')
	})

	it('should handle query parameters in URL', async () => {
		const request = new Request(
			'http://localhost:3000/test.html?param=value',
		)
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Test')
	})

	it('should handle root path request', async () => {
		const request = new Request('http://localhost:3000/')
		const ctx = new MockContext(request)
		const middleware = html(rootPath)

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Index')
	})
})
