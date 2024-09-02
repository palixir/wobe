import type { Context, WobeHandler } from 'wobe'
import { processRequest, type UploadOptions } from 'graphql-upload-ts'

export const wobeGraphqlUpload = (options?: UploadOptions): WobeHandler => {
	return async ({ request, res }: Context) => {
		// if (
		// 	request.headers.get('Content-Disposition') !== 'multipart/form-data'
		// )
		// 	return
		// console.log(await request.formData())
		// @ts-expect-error This is conventional
		request.body = await processRequest(request, new Response(), options)
	}
}
