import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { uploadDirectory } from './uploadDirectory'
import { join } from 'node:path'
import { mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import getPort from 'get-port'
import { Wobe } from '../Wobe'
import { Context } from '../Context'

describe('UploadDirectory Hook', () => {
	const testDirectory = join(__dirname, 'test-bucket')
	const fileName = 'test-file.txt'
	const filePath = join(testDirectory, fileName)
	const dotFileName = '.env'
	const dotFilePath = join(testDirectory, dotFileName)

	beforeEach(async () => {
		// Create a test directory and file before each test
		await mkdir(testDirectory, { recursive: true })
		await writeFile(filePath, 'This is a test file.')
		await writeFile(dotFilePath, 'SECRET')
	})

	afterEach(async () => {
		// Clean up the test directory and file after each test
		await rm(testDirectory, { recursive: true, force: true })
	})

	it('should serve an existing file with correct Content-Type', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory }),
		)

		wobe.listen(port)

		const response = await fetch(
			`http://127.0.0.1:${port}/bucket/${fileName}`,
		)

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('text/plain')

		const fileContent = await response.text()
		expect(fileContent).toBe('This is a test file.')

		wobe.stop()
	})

	it('should return 404 if the file does not exist', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory }),
		)

		wobe.listen(port)

		const response = await fetch(
			`http://127.0.0.1:${port}/bucket/non-existent-file.txt`,
		)

		expect(response.status).toBe(404)
		expect(await response.text()).toBe('File not found')

		wobe.stop()
	})

	it('should forbid path traversal', async () => {
		const handler = uploadDirectory({ directory: testDirectory })
		const request = new Request('http://localhost/bucket/../test')
		const context = new Context(request)

		context.params = { filename: '../test-file' }

		const response = await handler(context)

		expect(response?.status).toBe(403)
	})

	it('should forbid dotfiles by default', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory }),
		)

		wobe.listen(port)

		const response = await fetch(
			`http://127.0.0.1:${port}/bucket/${dotFileName}`,
		)

		expect(response.status).toBe(404)
		wobe.stop()
	})

	it('should forbid symlinks when not allowed', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		const symlinkPath = join(testDirectory, 'link.txt')
		await symlink(filePath, symlinkPath)

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory }),
		)

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/bucket/link.txt`)

		expect(response.status).toBe(403)
		wobe.stop()
	})

	it('should return 400 if the filename parameter is missing', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory }),
		)

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/bucket/`)

		expect(response.status).toBe(400)
		expect(await response.text()).toBe('Filename is required')

		wobe.stop()
	})

	it('should return 401 if not authorized', async () => {
		const port = await getPort()
		const wobe = new Wobe()

		wobe.get(
			'/bucket/:filename',
			uploadDirectory({ directory: testDirectory, isAuthorized: false }),
		)

		wobe.listen(port)

		const response = await fetch(`http://127.0.0.1:${port}/bucket/`)

		expect(response.status).toBe(401)
		expect(await response.text()).toBe('Unauthorized')

		wobe.stop()
	})
})
