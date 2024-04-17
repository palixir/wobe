import type { Context, WobeHandler } from 'wobe'
import type { TSchema, Static } from '@sinclair/typebox'

export const wobeValidator = ({}: { schema: TSchema }): WobeHandler => {
	return (ctx: Context) => {}
}
