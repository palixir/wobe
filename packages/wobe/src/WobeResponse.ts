export interface SetCookieOptions {
	name: string
	value: string
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
	public headers = new Headers({
		'Content-type': 'text/plain',
	})
	public body: string | null | ReadableStream = null
	public status: number = 200
	public statusText: string = 'OK'

	constructor(request: Request) {
		this.request = request
	}

	setCookie({
		name,
		value,
		httpOnly,
		path,
		domain,
		expires,
		sameSite,
		secure,
		maxAge,
	}: SetCookieOptions) {
		let cookie = `${name}=${value};`

		if (httpOnly) cookie = `${cookie} HttpOnly;`
		if (path) cookie = `${cookie} Path=${path};`
		if (domain) cookie = `${cookie} Domain=${domain};`
		if (expires) cookie = `${cookie} Expires=${expires.toUTCString()};`
		if (sameSite) cookie = `${cookie} SameSite=${sameSite};`
		if (secure) cookie = `${cookie} Secure;`
		if (maxAge) cookie = `${cookie} Max-Age=${maxAge};`

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
		this.setCookie({ name, value: '', expires: new Date(0) })
	}

	send(
		content: string | object,
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
		if (typeof content === 'object') {
			this.headers.set('Content-Type', 'application/json')
			this.body = JSON.stringify(content)
		} else {
			this.headers.set('charset', 'utf-8')
			this.body = content
		}

		if (status) this.status = status
		if (statusText) this.statusText = statusText

		if (headers) {
			const entries = Object.entries(headers)

			for (const [key, value] of entries) {
				this.headers?.set(key, value)
			}
		}

		this.response = new Response(this.body, {
			headers: this.headers,
			status: this.status,
			statusText: this.statusText,
		})

		return this.response
	}
}
