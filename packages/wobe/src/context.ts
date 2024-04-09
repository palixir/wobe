import { WobeResponse } from './WobeResponse'

export class Context {
	public res: WobeResponse
	public request: Request
	public ipAdress: string | undefined = undefined
	public state: 'beforeHandler' | 'handler' | 'afterHandler' = 'beforeHandler'
	public requestStartTimeInMs: number | undefined = undefined
	public body: string | object | undefined = undefined

	constructor(request: Request) {
		this.request = request
		this.res = new WobeResponse(request)
	}

	async initializeBody() {
		if (!this.request.body) return

		console.log(await this.request.text())

		if (this.request.headers.get('content-type') === 'application/json') {
			this.body = await this.request.json()
		} else {
			this.body = await this.request.text()
		}

		// console.log(this.body)
	}
}
