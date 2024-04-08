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

export const isMiddlewarePathnameMatchWithRoute = ({
	route,
	middlewarePathname,
}: {
	route: string
	middlewarePathname: string
}): boolean => {
	if (middlewarePathname[middlewarePathname.length - 1] === '/')
		middlewarePathname = middlewarePathname.slice(0, -1)

	const isPathNameEndingByWildcard =
		middlewarePathname[middlewarePathname.length - 1] === '*'

	if (middlewarePathname.length > route.length && !isPathNameEndingByWildcard)
		return false

	let isWildcardEncountering = false

	for (let i = 0; i < route.length; i++) {
		const routeChar = route[i]
		const middlewarePathnameChar = middlewarePathname[i]

		if (middlewarePathnameChar === '*') {
			isWildcardEncountering = true
			continue
		}

		if (isWildcardEncountering) {
			if (middlewarePathnameChar === '/') {
				isWildcardEncountering = false
			}

			continue
		}

		if (routeChar !== middlewarePathnameChar) return false
	}

	return true
}
