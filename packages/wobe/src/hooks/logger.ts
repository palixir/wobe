import type { HttpMethod, WobeHandler } from '../Wobe'

export interface LoggerFunctionOptions {
	beforeHandler: boolean
	method: HttpMethod
	url: string
	status?: number
	requestStartTimeInMs?: number
}

export interface LoggerOptions {
	loggerFunction: (options: LoggerFunctionOptions) => void
}

const defaultLoggerFunction = ({
	beforeHandler,
	method,
	url,
	status,
	requestStartTimeInMs,
}: LoggerFunctionOptions) => {
	console.log(
		`[${
			beforeHandler ? 'Before handler' : 'After handler'
		}] [${method}] ${url}${status ? ' (status:' + status + ')' : ''}${
			requestStartTimeInMs
				? '[' + (Date.now() - requestStartTimeInMs) + 'ms]'
				: ''
		}`,
	)
}

/**
 * logger is a hook that logs the request method, url, and status code
 */
export const logger = (
	{ loggerFunction }: LoggerOptions = {
		loggerFunction: defaultLoggerFunction,
	},
): WobeHandler<any> => {
	return (ctx) => {
		const { state, request } = ctx

		if (state === 'beforeHandler') {
			loggerFunction({
				beforeHandler: true,
				method: request.method as HttpMethod,
				url: request.url,
			})
			ctx.requestStartTimeInMs = Date.now()
		}

		if (state === 'afterHandler') {
			loggerFunction({
				beforeHandler: false,
				method: request.method as HttpMethod,
				url: request.url,
				status: ctx.res.status,
				requestStartTimeInMs: ctx.requestStartTimeInMs,
			})
		}
	}
}
