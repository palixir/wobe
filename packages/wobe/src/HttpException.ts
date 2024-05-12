/**
 * Custom exception for HTTP errors
 * Example usage: throw new HttpException(new Response('Not found', { status: 404 }))
 */
export class HttpException extends Error {
	response: Response

	constructor(response: Response) {
		super(response.statusText)

		this.response = response
	}
}
