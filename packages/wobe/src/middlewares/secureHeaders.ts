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
	crossOriginEmbedderPolicy?: string
	crossOriginOpenerPolicy?: string
	crossOriginResourcePolicy?: string
	referrerPolicy?: string
	strictTransportSecurity?: string[]
	xContentTypeOptions?: string
	xDownloadOptions?: string
}

export const secureHeaders = ({
	contentSecurityPolicy,
	crossOriginEmbedderPolicy,
	crossOriginOpenerPolicy = 'same-origin',
	crossOriginResourcePolicy = 'same-site',
	referrerPolicy = 'no-referrer',
	strictTransportSecurity = ['max-age=31536000; includeSubDomains'],
	xContentTypeOptions = 'nosniff',
	xDownloadOptions = 'noopen',
}: SecureHeadersOptions): WobeHandler => {
	return (_, res) => {
		if (contentSecurityPolicy) {
			const formatContentSecurityPolicy = Object.entries(
				contentSecurityPolicy,
			)
				.map(
					([key, value]) =>
						`${key} ${
							Array.isArray(value) ? value.join(' ') : value
						}`,
				)
				.join('; ')

			res.setHeader(
				'Content-Security-Policy',
				formatContentSecurityPolicy,
			)
		}

		if (crossOriginEmbedderPolicy)
			res.setHeader(
				'Cross-Origin-Embedder-Policy',
				crossOriginEmbedderPolicy,
			)

		if (crossOriginOpenerPolicy)
			res.setHeader('Cross-Origin-Opener-Policy', crossOriginOpenerPolicy)

		if (crossOriginResourcePolicy)
			res.setHeader(
				'Cross-Origin-Resource-Policy',
				crossOriginResourcePolicy,
			)

		if (referrerPolicy) res.setHeader('Referrer-Policy', referrerPolicy)

		if (strictTransportSecurity)
			res.setHeader(
				'Strict-Transport-Security',
				strictTransportSecurity.join('; '),
			)

		if (xContentTypeOptions)
			res.setHeader('X-Content-Type-Options', xContentTypeOptions)

		if (xDownloadOptions)
			res.setHeader('X-Download-Options', xDownloadOptions)
	}
}
