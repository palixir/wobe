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
	public response: Response

	constructor(request: Request) {
		this.request = request

		this.response = new Response()
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

		this.response.headers.append('Set-Cookie', cookie)
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
}
