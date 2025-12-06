import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { html } from './html'
import { WobeResponse } from '../WobeResponse'
import { join } from 'path'
import { rm, mkdir, writeFile, symlink } from 'node:fs/promises'

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
	const OUTSIDE_FILE = join(process.cwd(), 'outside-leak.txt')

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

	afterEach(async () => {
		await rm(rootPath, { recursive: true, force: true })
		await rm(OUTSIDE_FILE, { force: true })
	})

	it('should serve HTML files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/test.html')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Test')
	})

	it('should serve CSS files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/styles.css')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/css')
		expect(await response?.text()).toContain('body { color: red; }')
	})

	it('should serve JS files with correct Content-Type', async () => {
		const request = new Request('http://localhost:3000/script.js')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

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
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('application/json')
		expect(await response?.text()).toContain('"test": true')
	})

	it('should ignore dotfiles by default', async () => {
		await writeFile(join(TEST_DIR, '.env'), 'SECRET=1')

		const request = new Request('http://localhost:3000/.env')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(404)
	})

	it('should serve dotfiles when allowed', async () => {
		await writeFile(join(TEST_DIR, '.env'), 'SECRET=1')

		const request = new Request('http://localhost:3000/.env')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath, allowDotfiles: true })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(await response?.text()).toContain('SECRET=1')
	})

	it('should serve index.html when directory is requested', async () => {
		const request = new Request('http://localhost:3000/subdir/')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Subdir')
	})

	it('should serve index.html when directory without trailing slash is requested', async () => {
		const request = new Request('http://localhost:3000/subdir')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Subdir')
	})

	it('should return 404 for non-existent files', async () => {
		const request = new Request('http://localhost:3000/nonexistent.html')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(404)
		expect(await response?.text()).toBe('Not Found')
	})

	it('should serve fallback file for SPA when file not found', async () => {
		const request = new Request('http://localhost:3000/nonexistent')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath, fallbackFile: 'index.html' })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Index')
	})

	it('should return 404 when fallback file does not exist', async () => {
		const request = new Request('http://localhost:3000/nonexistent')
		const ctx = new MockContext(request)
		const middleware = html({
			rootPath,
			fallbackFile: 'nonexistent-fallback.html',
		})

		const response = await middleware(ctx)
		expect(response?.status).toBe(404)
		expect(await response?.text()).toBe('Not Found')
	})

	it('should handle URL-encoded paths', async () => {
		// Create a file with spaces in the name
		await writeFile(
			join(TEST_DIR, 'file with spaces.html'),
			'<html>Spaces</html>',
		)

		const request = new Request(
			'http://localhost:3000/file%20with%20spaces.html',
		)
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Spaces')
	})

	it('should handle files with no extension', async () => {
		await writeFile(join(TEST_DIR, 'noextension'), 'No extension content')

		const request = new Request('http://localhost:3000/noextension')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

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
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Test')
	})

	it('should handle root path request', async () => {
		const request = new Request('http://localhost:3000/')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Index')
	})

	it('should respond to HEAD without body', async () => {
		const request = new Request('http://localhost:3000/test.html', {
			method: 'HEAD',
		})
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toBe('')
	})

	it('should serve files when mounted under a prefix with stripPrefix', async () => {
		const request = new Request('http://localhost:3000/tata/test.html')
		const ctx = new MockContext(request)
		const middleware = html({
			rootPath,
			stripPrefix: '/tata',
		})

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Test')
	})

	it('should serve fallback under a prefix when file is missing', async () => {
		const request = new Request('http://localhost:3000/tata/missing')
		const ctx = new MockContext(request)
		const middleware = html({
			rootPath,
			fallbackFile: 'index.html',
			stripPrefix: '/tata',
		})

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('text/html')
		expect(await response?.text()).toContain('Index')
	})

	it('should serve symlink that stays inside root', async () => {
		// relative target from within the same directory
		await symlink('test.html', join(TEST_DIR, 'alias.html'))

		const request = new Request('http://localhost:3000/alias.html')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(await response?.text()).toContain('Test')
	})

	it('should block symlink escaping root by default', async () => {
		await writeFile(OUTSIDE_FILE, 'leak')
		await symlink(OUTSIDE_FILE, join(TEST_DIR, 'leak.html'))

		const request = new Request('http://localhost:3000/leak.html')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(403)
	})

	it('should allow symlink outside root when explicitly enabled', async () => {
		await writeFile(OUTSIDE_FILE, 'leak-ok')
		await symlink(OUTSIDE_FILE, join(TEST_DIR, 'leak-allowed.html'))

		const request = new Request('http://localhost:3000/leak-allowed.html')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath, allowSymlinks: true })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(await response?.text()).toContain('leak-ok')
	})

	it('should return 405 for non-GET/HEAD methods', async () => {
		const request = new Request('http://localhost:3000/test.html', {
			method: 'POST',
		})
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(405)
		expect(response?.headers.get('Allow')).toBe('GET, HEAD')
	})

	it('should block SPA fallback if it resolves outside root when symlinks disallowed', async () => {
		await writeFile(OUTSIDE_FILE, 'fallback leak')
		await symlink(OUTSIDE_FILE, join(TEST_DIR, 'outside-fallback.html'))

		const request = new Request('http://localhost:3000/unknown')
		const ctx = new MockContext(request)
		const middleware = html({
			rootPath,
			fallbackFile: 'outside-fallback.html',
		})

		const response = await middleware(ctx)
		expect(response?.status).toBe(403)
	})

	it('should not leak files outside the root (normalized URL)', async () => {
		const request = new Request('http://localhost:3000/../package.json')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		// WHATWG URL normalizes '/../package.json' to '/package.json', so we get a 404.
		expect(response?.status).toBe(404)
		expect(await response?.text()).toBe('Not Found')
	})

	it('should return 400 on malformed URI', async () => {
		const request = new Request('http://localhost:3000/%E0%A4%A')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(400)
		expect(await response?.text()).toBe('Bad Request')
	})

	it('should serve binary files without mangling', async () => {
		const binary = new Uint8Array([0, 1, 2, 3])
		await writeFile(join(TEST_DIR, 'image.png'), binary)

		const request = new Request('http://localhost:3000/image.png')
		const ctx = new MockContext(request)
		const middleware = html({ rootPath })

		const response = await middleware(ctx)
		expect(response?.status).toBe(200)
		expect(response?.headers.get('Content-Type')).toBe('image/png')
		if (!response) throw new Error('Expected response')
		const buffer = new Uint8Array(await response.arrayBuffer())
		expect(Array.from(buffer)).toEqual(Array.from(binary))
	})
})
