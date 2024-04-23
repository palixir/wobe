import { HttpException, type Context, type WobeHandler } from 'wobe'
import type { TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export const wobeValidator = (schema: TSchema): WobeHandler => {
	return async (ctx: Context) => {
		const request = ctx.request

		if (request.headers.get('content-type') !== 'application/json')
			throw new HttpException(new Response(null, { status: 400 }))

		const body = await request.json()

		if (!Value.Check(schema, body))
			throw new HttpException(
				new Response(
					JSON.stringify({
						errors: [...Value.Errors(schema, body)],
					}),
					{ status: 400 },
				),
			)
	}
}
