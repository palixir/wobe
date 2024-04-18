import { WobeResponse } from './WobeResponse'

export class Context {
	public res: WobeResponse
	public request: Request
	public params: Record<string, string> = {}
	public query: Record<string, string> = {}

	public ipAdress: string | undefined = undefined
	public state: 'beforeHandler' | 'handler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined
	public body: string | object = {}
	public getIpAdress: () => string = () => ''

	constructor(request: Request) {
		this.request = request
		this.res = new WobeResponse(request)
	}

	redirect(url: string, status = 302) {
		this.res.headers.set('Location', url)
		this.res.status = status
	}
}
