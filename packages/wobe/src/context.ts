import { WobeResponse } from './WobeResponse'

export class Context {
	public res: WobeResponse
	public request: Request
	public ipAdress: string | undefined = undefined
	public state: 'beforeHandler' | 'handler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined
	public body: string | object | undefined = undefined
	public getIpAdress: (req: Request) => string = () => ''

	constructor(request: Request) {
		this.request = request
		this.res = new WobeResponse(request)
	}

	json() {
		return this.request.json() as Promise<object>
	}

	text() {
		return this.request.text() as Promise<string>
	}
}
