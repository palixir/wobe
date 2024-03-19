export const extractPathnameAndSearchParams = (url: string) => {
	// With host : /^(?:https?:\/\/)?(?:[^\/]+)?(.+?)(?:\?(.*))?$/
	// The version with host is more accurate but slower (around 10% slower)
	const matches = url.match(
		/^https?:\/\/[^\/]+([^?#]+)(?:\?([^#]*))?(?:#.*)?$/,
	)

	const pathName = matches?.[1]

	if (matches?.[2]) {
		const searchParams: Record<string, string> = {}

		const allParams = matches[2].split('&')

		for (let i = 0; i < allParams.length; i++) {
			const [key, value] = allParams[i].split('=')
			searchParams[key] = value
		}

		return { pathName, searchParams }
	}

	return { pathName }
}

export const HttpException = (message: string, statusCode: number) => {
	const error = new Error(message)

	// @ts-expect-error
	error.code = statusCode

	return error
}
