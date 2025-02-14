import { access, constants, readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import type { WobeHandler } from '../Wobe'
import mimeTypes from '../utils'

export interface UploadDirectoryOptions {
	directory: string
	isAuthorized?: boolean
}

/**
 * uploadDirectory is a hook that allow you to access to all files in a directory
 * You must provide the filename parameter in the route
 * Usage: wobe.get('/bucket/:filename', uploadDirectory({ directory: './bucket', isAuthorized: true }))
 */
export const uploadDirectory = ({
	directory,
	isAuthorized = true,
}: UploadDirectoryOptions): WobeHandler<any> => {
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

		const filePath = join(directory, fileName)

		try {
			await access(filePath, constants.F_OK)

			const fileContent = await readFile(filePath)

			const ext = extname(filePath).toLowerCase()

			const contentType = mimeTypes[ext] || 'application/octet-stream'

			ctx.res.headers.set('Content-Type', contentType)
			ctx.res.headers.set(
				'Content-Length',
				fileContent.byteLength.toString(),
			)

			return ctx.res.send(fileContent)
		} catch (error) {
			ctx.res.status = 404
			return ctx.res.sendText('File not found')
		}
	}
}
