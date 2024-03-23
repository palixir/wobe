import type { HttpMethod, WobeHandler } from '../Wobe'

export interface LoggerFunctionOptions {
	method: HttpMethod
	url: string
	status?: number
	requestStartTimeInMs?: number
}

export interface LoggerOptions {
	loggerFunction?: (options: LoggerFunctionOptions) => void
}

const defaultLoggerFunction = ({
	method,
	url,
	status,
	requestStartTimeInMs,
}: LoggerFunctionOptions) => {
	console.log(
		`[Wobe] [${method}] ${url}: ${status ? ':' + status : ''} ${requestStartTimeInMs ? '[' + (Date.now() - requestStartTimeInMs) + 'ms]' : ''}`,
	)
}

export const logger = ({
	loggerFunction = defaultLoggerFunction,
}: LoggerOptions): WobeHandler => {
	return (ctx, res) => {
		const { state, request } = ctx

		if (state === 'beforeHandler') {
			loggerFunction({
				method: request.method as HttpMethod,
				url: request.url,
			})
			ctx.requestStartTimeInMs = Date.now()
		}

		if (state === 'afterHandler') {
			loggerFunction({
				method: request.method as HttpMethod,
				url: request.url,
				status: res.status,
				requestStartTimeInMs: ctx.requestStartTimeInMs,
			})
		}
	}
}
