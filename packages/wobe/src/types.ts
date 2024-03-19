export const HttpException = (message: string, statusCode: number) => {
	const error = new Error(message)

	// @ts-expect-error
	error.code = statusCode

	return error
}
