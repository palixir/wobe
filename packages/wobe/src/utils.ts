export const extractPathnameAndSearchParams = (url: string) => {
	// 8 because this is the length of 'https://'
	const queryIndex = url.indexOf('?', 8)
	const urlLength = url.length

	const isQueryContainsSearchParams = queryIndex !== -1

	const path = url.slice(
		url.indexOf('/', 8),
		!isQueryContainsSearchParams ? urlLength : queryIndex,
	)

	if (isQueryContainsSearchParams) {
		const searchParams: Record<string, string> = {}
		let indexOfLastParam = queryIndex + 1
		let indexOfLastEqual = -1

		for (let i = queryIndex + 1; i < urlLength; i++) {
			const char = url[i]

			if (char === '=') {
				indexOfLastEqual = i
				continue
			}

			if (char === '&' || i === urlLength - 1) {
				searchParams[url.slice(indexOfLastParam, indexOfLastEqual)] =
					url.slice(
						indexOfLastEqual + 1,
						i === urlLength - 1 ? i + 1 : i,
					)
				indexOfLastParam = i + 1
			}
		}

		return { pathName: path, searchParams }
	}

	return { pathName: path }
}

type MimeType = {
	[key: string]: string
}

export const mimeTypes: MimeType = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.pdf': 'application/pdf',
	'.txt': 'text/plain',
	'.csv': 'text/csv',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.flac': 'audio/flac',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.ogg': 'video/ogg',
	'.mpeg': 'video/mpeg',
	'.zip': 'application/zip',
	'.doc': 'application/msword',
	'.docx':
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx':
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.bmp': 'image/bmp',
	'.ico': 'image/x-icon',
	'.tiff': 'image/tiff',
	'.rtf': 'application/rtf',
	'.md': 'text/markdown',
	'.epub': 'application/epub+zip',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.otf': 'font/otf',
	'.ttf': 'font/ttf',
	'.7z': 'application/x-7z-compressed',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',
	'.rar': 'application/vnd.rar',
	'.avi': 'video/x-msvideo',
	'.mov': 'video/quicktime',
	'.wmv': 'video/x-ms-wmv',
	'.flv': 'video/x-flv',
	'.mkv': 'video/x-matroska',
	'.psd': 'image/vnd.adobe.photoshop',
	'.ai': 'application/postscript',
	'.eps': 'application/postscript',
	'.ps': 'application/postscript',
	'.sql': 'application/sql',
	'.sh': 'application/x-sh',
	'.php': 'application/x-httpd-php',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx':
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.odt': 'application/vnd.oasis.opendocument.text',
	'.ods': 'application/vnd.oasis.opendocument.spreadsheet',
	'.odp': 'application/vnd.oasis.opendocument.presentation',
	'.aac': 'audio/aac',
	'.mid': 'audio/midi',
	'.wma': 'audio/x-ms-wma',
	'.webp': 'image/webp',
	'.m4a': 'audio/mp4',
	'.m4v': 'video/mp4',
	'.3gp': 'video/3gpp',
	'.3g2': 'video/3gpp2',
	'.ts': 'video/mp2t',
	'.m3u8': 'application/vnd.apple.mpegurl',
	'.ics': 'text/calendar',
	'.vcf': 'text/vcard',
	'.yaml': 'application/x-yaml',
	'.yml': 'application/x-yaml',
	'.avif': 'image/avif',
	'.heic': 'image/heic',
	'.heif': 'image/heif',
	'.jxl': 'image/jxl',
	'.webmanifest': 'application/manifest+json',
	'.opus': 'audio/opus',
	'.weba': 'audio/webm',
	'.mjs': 'text/javascript',
	'.cjs': 'text/javascript',
}

export default mimeTypes
