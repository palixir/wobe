import { join, normalize, resolve, sep } from 'node:path'
import { stat, realpath } from 'node:fs/promises'
import type { WobeHandler } from '../Wobe'

export type HtmlOptions = {
	rootPath: string
	fallbackFile?: string
	stripPrefix?: string
	allowDotfiles?: boolean
	allowSymlinks?: boolean
}

const getContentType = (filePath: string): string => {
	const ext = filePath.split('.').pop()?.toLowerCase()
	switch (ext) {
		case 'html':
			return 'text/html'
		case 'htm':
			return 'text/html'
		case 'css':
			return 'text/css'
		case 'js':
			return 'application/javascript'
		case 'mjs':
		case 'cjs':
			return 'text/javascript'
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
		case 'ico':
			return 'image/x-icon'
		case 'webp':
			return 'image/webp'
		case 'avif':
			return 'image/avif'
		case 'wasm':
			return 'application/wasm'
		case 'woff':
			return 'font/woff'
		case 'woff2':
			return 'font/woff2'
		case 'map':
			return 'application/json'
		case 'pdf':
			return 'application/pdf'
		case 'zip':
			return 'application/zip'
		case 'mp4':
			return 'video/mp4'
		case 'webm':
			return 'video/webm'
		case 'ogg':
			return 'audio/ogg'
		case 'mp3':
			return 'audio/mpeg'
		case 'wav':
			return 'audio/wav'
		default:
			return 'application/octet-stream'
	}
}

const isTextType = (contentType: string) =>
	contentType.startsWith('text/') ||
	contentType.includes('json') ||
	contentType.includes('javascript') ||
	contentType.includes('xml') ||
	contentType.includes('svg')

const resolveFilePath = async (requestedPath: string) => {
	try {
		const stats = await stat(requestedPath)
		if (stats.isDirectory()) return join(requestedPath, 'index.html')
	} catch {
		// ignore missing stats; fallback to requested path
	}

	if (requestedPath.endsWith(sep)) return join(requestedPath, 'index.html')

	return requestedPath
}

const trySendFile = async (
	ctx: any,
	filePath: string,
	options: {
		forceHtml?: boolean
		resolvedRoot: string
		allowSymlinks: boolean
		method: string
	},
): Promise<Response | undefined> => {
	try {
		const stats = await stat(filePath)
		if (!stats.isFile()) return
		const { forceHtml, resolvedRoot, allowSymlinks, method } = options

		const real = await realpath(filePath)
		if (!allowSymlinks) {
			const insideRoot = real === resolvedRoot || real.startsWith(resolvedRoot + sep)
			if (!insideRoot) return ctx.res.send('Forbidden', { status: 403 })
		}

		const file = Bun.file(real)
		const contentType = forceHtml ? 'text/html' : getContentType(real)

		// For HEAD, do not read file content; return headers only
		if (method === 'HEAD')
			return ctx.res.send('', {
				headers: { 'Content-Type': contentType },
			})

		const body = isTextType(contentType) ? await file.text() : await file.arrayBuffer()

		return ctx.res.send(body, {
			headers: { 'Content-Type': contentType },
		})
	} catch {
		return
	}
}

const isDotPath = (relativePath: string) =>
	relativePath
		.split(/[\\/]/)
		.filter((segment) => segment !== '' && segment !== '.')
		.some((segment) => segment.startsWith('.'))

/**
 * Middleware to serve static files (HTML, JS, CSS, etc.)
 * @param options.rootPath Path to the root directory of static files (e.g., 'dist')
 * @param options.fallbackFile File to return in case of 404 (e.g., 'index.html' for a SPA)
 * @param options.stripPrefix Optional prefix to strip when mounted under a sub-route
 * @param options.allowDotfiles Allow serving dotfiles (default: false)
 * @param options.allowSymlinks Allow serving symlinks (default: false)
 */
export const html = (options: HtmlOptions): WobeHandler<any> => {
	const {
		rootPath,
		fallbackFile,
		stripPrefix,
		allowDotfiles = false,
		allowSymlinks = false,
	} = options
	const resolvedRoot = resolve(rootPath)
	const normalizedPrefix = stripPrefix ? stripPrefix.replace(/\/+$/, '') : undefined

	return async (ctx) => {
		const method = ctx.request.method?.toUpperCase?.() || 'GET'
		if (method !== 'GET' && method !== 'HEAD') {
			return ctx.res.send('Method Not Allowed', {
				status: 405,
				headers: { Allow: 'GET, HEAD' },
			})
		}

		const { pathname } = new URL(ctx.request.url)
		let decodedPathname: string

		try {
			decodedPathname = decodeURIComponent(pathname)
		} catch {
			return ctx.res.send('Bad Request', { status: 400 })
		}

		// Strip mounting prefix if configured (for mounted routes like /static/*)
		const withoutPrefix =
			normalizedPrefix && decodedPathname.startsWith(normalizedPrefix)
				? decodedPathname.slice(normalizedPrefix.length) || '/'
				: decodedPathname

		const normalizedPathRaw = normalize(withoutPrefix.replace(/^\/+/, '') || '')
		const normalizedPath = normalizedPathRaw === '.' ? '' : normalizedPathRaw

		if (!allowDotfiles && isDotPath(normalizedPath))
			return ctx.res.send('Not Found', { status: 404 })

		const requestedPath = resolve(resolvedRoot, normalizedPath)
		const isInsideRoot =
			requestedPath === resolvedRoot || requestedPath.startsWith(resolvedRoot + sep)

		if (!isInsideRoot) return ctx.res.send('Forbidden', { status: 403 })

		const filePath = await resolveFilePath(requestedPath)

		const served = await trySendFile(ctx, filePath, {
			resolvedRoot,
			allowSymlinks,
			method,
		})
		if (served) return served

		if (fallbackFile) {
			const fallbackPath = resolve(resolvedRoot, fallbackFile)
			const isFallbackInsideRoot =
				fallbackPath === resolvedRoot || fallbackPath.startsWith(resolvedRoot + sep)

			if (isFallbackInsideRoot) {
				const fallbackServed = await trySendFile(ctx, fallbackPath, {
					forceHtml: true,
					resolvedRoot,
					allowSymlinks,
					method,
				})
				if (fallbackServed) return fallbackServed
			}
		}

		return ctx.res.send('Not Found', { status: 404 })
	}
}
