import type { WobeHandler } from '../Wobe'

export interface LoggerOptions {
	loggerFunction?: (message: string, ...args: string[]) => void
}

export const logger = ({
	loggerFunction = console.log,
}: LoggerOptions): WobeHandler => {
	return (ctx, res) => {}
}
