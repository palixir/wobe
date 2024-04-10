export const extractPathnameAndSearchParams = (request: Request) => {
	const url = request.url
	// 8 because this is the length of 'https://'
	const queryIndex = url.indexOf('?', 8)

	const path = url.slice(
		url.indexOf('/', 8),
		queryIndex === -1 ? url.length : queryIndex,
	)

	if (queryIndex !== -1) {
		const searchParams: Record<string, string> = {}
		let indexOfLastParam = queryIndex + 1

		let currentKey = ''
		let currentValue = ''

		for (let i = queryIndex + 1; i < url.length; i++) {
			const char = url[i]

			if (char === '=') {
				currentKey = url.slice(indexOfLastParam, i)
				indexOfLastParam = i + 1
			}

			if (char === '&' || i === url.length - 1) {
				currentValue = url.slice(
					indexOfLastParam,
					i === url.length - 1 ? i + 1 : i,
				)

				indexOfLastParam = i + 1
				searchParams[currentKey] = currentValue
			}
		}

		return { pathName: path, searchParams }
	}

	return { pathName: path }
}
