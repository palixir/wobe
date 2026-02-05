import { access, constants, lstat, readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import type { WobeHandler } from '../Wobe'
import mimeTypes from '../utils'

export interface UploadDirectoryOptions {
	directory: string
	isAuthorized?: boolean
	allowSymlinks?: boolean
	allowDotfiles?: boolean
}

/**
 * Serve a file from a given directory for routes like `/bucket/:filename`.
 * It blocks traversal (`..`), dotfiles (by default), and symlinks (by default),
 * and returns 400/401/403/404 with clear messages when access is not allowed.
 */
export const uploadDirectory = ({
	directory,
	isAuthorized = true,
	allowSymlinks = false,
	allowDotfiles = false,
}: UploadDirectoryOptions): WobeHandler<any> => {
	const resolvedRoot = resolve(directory)

	const isDotFile = (relativePath: string) =>
		relativePath
			.split(/[\\/]/)
			.filter((segment) => segment !== '' && segment !== '.')
			.some((segment) => segment.startsWith('.'))
	const hasTraversal = (relativePath: string) =>
		relativePath
			.split(/[\\/]/)
			.filter((segment) => segment.length > 0)
			.some((segment) => segment === '..')

	return async (ctx) => {
		if (!isAuthorized) {
			ctx.res.status = 401
			return ctx.res.sendText('Unauthorized')
		}

		const fileName = ctx.params.filename

		if (!fileName) {
			ctx.res.status = 400
			return ctx.res.sendText('Filename is required')
		}

		if (hasTraversal(fileName)) {
			ctx.res.status = 403
			return ctx.res.sendText('Forbidden')
		}

		// Protect against traversal and dotfiles
		if (!allowDotfiles && isDotFile(fileName)) {
			ctx.res.status = 404
			return ctx.res.sendText('File not found')
		}

		const filePath = resolve(resolvedRoot, fileName)

		const isInsideRoot = filePath === resolvedRoot || filePath.startsWith(resolvedRoot + sep)

		if (!isInsideRoot) {
			ctx.res.status = 403
			return ctx.res.sendText('Forbidden')
		}

		try {
			await access(filePath, constants.F_OK)

			if (!allowSymlinks) {
				const stats = await lstat(filePath)
				if (stats.isSymbolicLink()) {
					ctx.res.status = 403
					return ctx.res.sendText('Forbidden')
				}
			}

			const fileContent = await readFile(filePath)

			const ext = extname(filePath).toLowerCase()

			const contentType = mimeTypes[ext] || 'application/octet-stream'

			ctx.res.headers.set('Content-Type', contentType)
			ctx.res.headers.set('Content-Length', fileContent.byteLength.toString())

			return ctx.res.send(fileContent)
		} catch {
			ctx.res.status = 404
			return ctx.res.sendText('File not found')
		}
	}
}
