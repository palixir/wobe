export interface SetCookieOptions {
	path?: string
	domain?: string
	expires?: Date
	maxAge?: number
	secure?: boolean
	httpOnly?: boolean
	sameSite?: 'Strict' | 'Lax' | 'None'
}

export class WobeResponse {
	public request: Request
	public response: Response | undefined = undefined
	public headers: typeof Headers.prototype = new Headers()
	public status = 200
	public statusText = 'OK'

	constructor(request: Request) {
		this.request = request
	}

	/**
	 * Copy a response into an existing wobe instance response
	 * @param response The response to copy
	 * @returns A new wobe instance response
	 */
	copy(response: Response) {
		const wobeResponse = new WobeResponse(this.request)

		wobeResponse.headers = new Headers(response.headers)

		for (const [key, value] of this.headers.entries())
			wobeResponse.headers.set(key, value)

		wobeResponse.status = response.status
		wobeResponse.statusText = response.statusText
		wobeResponse.response = response

		return wobeResponse
	}

	/**
	 * Set a cookie
	 * @param name The name of the cookie
	 * @param value The value of the cookie
	 * @param options The options of the cookie
	 */
	setCookie(name: string, value: string, options?: SetCookieOptions) {
		let cookie = `${name}=${value};`

		if (options) {
			const {
				httpOnly,
				path,
				domain,
				expires,
				sameSite,
				maxAge,
				secure,
			} = options

			if (httpOnly) cookie = `${cookie} HttpOnly;`
			if (path) cookie = `${cookie} Path=${path};`
			if (domain) cookie = `${cookie} Domain=${domain};`
			if (expires) cookie = `${cookie} Expires=${expires.toUTCString()};`
			if (sameSite) cookie = `${cookie} SameSite=${sameSite};`
			if (secure) cookie = `${cookie} Secure;`
			if (maxAge) cookie = `${cookie} Max-Age=${maxAge};`
		}

		this.headers?.append('Set-Cookie', cookie)
	}

	/**
	 * Get a cookie
	 * @param cookieName The name of the cookie
	 */
	getCookie(cookieName: string) {
		const cookies = this.request.headers.get('Cookie')

		if (!cookies) return

		const cookie = cookies.split(';').find((c) => c.includes(cookieName))

		if (!cookie) return

		return cookie.split('=')[1]
	}

	/**
	 * Delete a cookie
	 * @param name The name of the cookie
	 */
	deleteCookie(name: string) {
		this.setCookie(name, '', { expires: new Date(0) })
	}

	/**
	 * Send a JSON response
	 * @param content The json content of the response
	 * @returns The response
	 */
	sendJson(content: Record<string, any>) {
		this.headers.set('content-type', 'application/json')
		this.headers.set('charset', 'utf-8')

		this.response = new Response(JSON.stringify(content), {
			headers: this.headers,
			status: this.status,
			statusText: this.statusText,
		})

		return this.response
	}

	/**
	 * Send a text response
	 * @param content The text content of the response
	 * @returns The response
	 */
	sendText(content: string) {
		this.headers.set('content-type', 'text/plain')
		this.headers.set('charset', 'utf-8')

		this.response = new Response(content, {
			headers: this.headers,
			status: this.status,
			statusText: this.statusText,
		})

		return this.response
	}

	/**
	 * Send a response (text or json)
	 * @param content The content of the response
	 * @param object The object contains the status, statusText and headers of the response
	 * @returns The response
	 */
	send(
		content: string | Record<string, any> | ArrayBuffer | Buffer | null,
		{
			status,
			statusText,
			headers = new Headers(),
		}: {
			status?: number
			statusText?: string
			headers?: Record<string, any>
		} = {},
	) {
		let body: Bun.BodyInit | undefined = undefined

		if (content instanceof ArrayBuffer) {
			body = content
		} else if (content instanceof SharedArrayBuffer) {
			body = new Uint8Array(content)
		} else if (content instanceof Buffer) {
			body = new Uint8Array(
				content.buffer,
				content.byteOffset,
				content.byteLength,
			)
		} else if (typeof content === 'object') {
			this.headers.set('content-type', 'application/json')
			this.headers.set('charset', 'utf-8')

			body = JSON.stringify(content)
		} else {
			this.headers.set('content-type', 'text/plain')
			this.headers.set('charset', 'utf-8')

			body = content
		}

		if (status) this.status = status
		if (statusText) this.statusText = statusText

		if (headers) {
			const entries = Object.entries(headers)

			for (const [key, value] of entries) {
				this.headers?.set(key, value)
			}
		}

		this.response = new Response(body, {
			headers: this.headers,
			status: this.status,
			statusText: this.statusText,
		})

		return this.response
	}
}
