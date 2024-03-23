export interface Context {
	request: Request
	state?: 'beforeHandler' | 'handler' | 'afterHandler'
}
