import type { Context, WobeHandler } from 'wobe'
import { processRequest, type UploadOptions } from 'graphql-upload-minimal'

export const wobeGraphqlUpload = (options?: UploadOptions): WobeHandler => {
	return async ({ request, res }: Context) => {
		if (
			request.headers.get('Content-Disposition') !== 'multipart/form-data'
		)
			return

		// @ts-expect-error This is conventional
		request.body = await processRequest(request, res.response, options)
	}
}
