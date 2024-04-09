import { WobeResponse } from './WobeResponse'

export class Context {
	public res: WobeResponse
	public request: Request
	public ipAdress: string | undefined = undefined
	public state: 'beforeHandler' | 'handler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined

	constructor(request: Request) {
		this.request = request
		this.res = new WobeResponse(request)
	}
}
