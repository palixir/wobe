import type { WobeHandler } from '../Wobe'

interface ContentSecurityPolicyOptions {
	'default-src'?: string[]
	'base-uri'?: string[]
	'child-src'?: string[]
	'connect-src'?: string[]
	'font-src'?: string[]
	'form-action'?: string[]
	'frame-ancestors'?: string[]
	'frame-src'?: string[]
	'img-src'?: string[]
	'manifest-src'?: string[]
	'media-src'?: string[]
	'object-src'?: string[]
	'report-to'?: string
	sandbox?: string[]
	'script-src'?: string[]
	'script-src-attr'?: string[]
	'script-src-elem'?: string[]
	'style-src'?: string[]
	'style-src-attr'?: string[]
	'style-src-elem'?: string[]
	'upgrade-insecure-requests'?: string[]
	'worker-src'?: string[]
}

export interface SecureHeadersOptions {
	contentSecurityPolicy?: ContentSecurityPolicyOptions
}

export const secureHeaders = (options?: SecureHeadersOptions): WobeHandler => {
	return (req, res) => {
		if (options?.contentSecurityPolicy) {
			const contentSecurityPolicy = Object.entries(
				options.contentSecurityPolicy,
			)
				.map(
					([key, value]) =>
						`${key} ${Array.isArray(value) ? value.join(' ') : value}`,
				)
				.join('; ')

			res.setHeaders('Content-Security-Policy', contentSecurityPolicy)
		}
	}
}
