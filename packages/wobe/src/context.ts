export interface Context {
	request: Request
	ipAdress: string
	state?: 'beforeHandler' | 'handler' | 'afterHandler'
	requestStartTimeInMs?: number
}
