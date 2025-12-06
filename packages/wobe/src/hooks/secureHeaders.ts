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
	xFrameOptions?: string | false
}

/**
 * secureHeaders is a hook that sets secure headers (equivalent of helmet on express)
 */
export const secureHeaders = ({
	contentSecurityPolicy,
	crossOriginEmbedderPolicy,
	crossOriginOpenerPolicy = 'same-origin',
	crossOriginResourcePolicy = 'same-site',
	referrerPolicy = 'no-referrer',
	strictTransportSecurity = ['max-age=31536000; includeSubDomains'],
	xContentTypeOptions = 'nosniff',
	xDownloadOptions = 'noopen',
	xFrameOptions = 'SAMEORIGIN',
}: SecureHeadersOptions): WobeHandler<any> => {
	return (ctx) => {
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

			ctx.res.headers.set(
				'Content-Security-Policy',
				formatContentSecurityPolicy,
			)
		}

		if (crossOriginEmbedderPolicy)
			ctx.res.headers.set(
				'Cross-Origin-Embedder-Policy',
				crossOriginEmbedderPolicy,
			)

		if (crossOriginOpenerPolicy)
			ctx.res.headers.set(
				'Cross-Origin-Opener-Policy',
				crossOriginOpenerPolicy,
			)

		if (crossOriginResourcePolicy)
			ctx.res.headers.set(
				'Cross-Origin-Resource-Policy',
				crossOriginResourcePolicy,
			)

		if (referrerPolicy)
			ctx.res.headers.set('Referrer-Policy', referrerPolicy)

		if (strictTransportSecurity)
			ctx.res.headers.set(
				'Strict-Transport-Security',
				strictTransportSecurity.join('; '),
			)

		if (xContentTypeOptions)
			ctx.res.headers.set('X-Content-Type-Options', xContentTypeOptions)

		if (xDownloadOptions)
			ctx.res.headers.set('X-Download-Options', xDownloadOptions)

		if (xFrameOptions) ctx.res.headers.set('X-Frame-Options', xFrameOptions)
	}
}
