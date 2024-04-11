export const extractPathnameAndSearchParams = (request: Request) => {
	const url = request.url
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
