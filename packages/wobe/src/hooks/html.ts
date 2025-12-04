import { join } from 'path'
import type { WobeHandler } from '../Wobe'

/**
 * Middleware to serve static files (HTML, JS, CSS, etc.)
 * @param rootPath Path to the root directory of static files (e.g., 'dist')
 * @param fallbackFile File to return in case of 404 (e.g., 'index.html' for a SPA)
 */
export const html = (
	rootPath: string,
	fallbackFile: string = 'index.html',
): WobeHandler<any> => {
	return async (ctx) => {
		const { pathname } = new URL(ctx.request.url)
		const filePath = join(rootPath, pathname)

		// Try to read the file
		try {
			const file = Bun.file(filePath)
			if (await file.exists()) {
				// Determine Content-Type based on file extension
				const contentType = getContentType(filePath)

				return ctx.res.send(await file.text(), {
					headers: { 'Content-Type': contentType },
				})
			}
		} catch {
			// File not found, proceed to SPA fallback if defined
		}

		// If the file does not exist and SPA fallback is defined, serve it
		if (fallbackFile) {
			const fallbackPath = join(rootPath, fallbackFile)
			try {
				const fallbackFile = Bun.file(fallbackPath)
				if (await fallbackFile.exists()) {
					return ctx.res.send(fallbackFile.text(), {
						headers: { 'Content-Type': 'text/html' },
					})
				}
			} catch {}
		}

		// Return 404 if no file was found
		return ctx.res.send('Not Found', { status: 404 })
	}
}

// Function to determine Content-Type based on file extension
function getContentType(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase()
	switch (ext) {
		case 'html':
			return 'text/html'
		case 'css':
			return 'text/css'
		case 'js':
			return 'application/javascript'
		case 'json':
			return 'application/json'
		case 'png':
			return 'image/png'
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'gif':
			return 'image/gif'
		case 'svg':
			return 'image/svg+xml'
		case 'txt':
			return 'text/plain'
		default:
			return 'application/octet-stream'
	}
}
