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
	public headers = new Headers()
	public status = 200
	public statusText = 'OK'

	constructor(request: Request) {
		this.request = request
	}

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

	getCookie(cookieName: string) {
		const cookies = this.request.headers.get('Cookie')

		if (!cookies) return

		const cookie = cookies.split(';').find((c) => c.includes(cookieName))

		if (!cookie) return

		return cookie.split('=')[1]
	}

	deleteCookie(name: string) {
		this.setCookie(name, '', { expires: new Date(0) })
	}

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

	send(
		content: string | Record<string, any>,
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
		let body: string

		if (typeof content === 'object') {
			this.headers.set('content-type', 'application/json')
			body = JSON.stringify(content)
		} else {
			this.headers.set('content-type', 'text/plain')
			body = content
		}

		this.headers.set('charset', 'utf-8')

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
