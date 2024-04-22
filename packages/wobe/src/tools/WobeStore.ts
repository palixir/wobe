export interface WobeStoreOptions {
	interval: number
}

export class WobeStore<T> {
	private options: WobeStoreOptions
	private store: Record<string, any>

	private intervalId: Timer | undefined = undefined

	constructor(options: WobeStoreOptions) {
		this.options = options
		this.store = {}

		this._init()
	}

	_init() {
		this.intervalId = setInterval(() => {
			this.clear()
		}, this.options.interval)
	}

	set(key: string, value: T) {
		this.store[key] = value
	}

	get(key: string): T | undefined {
		return this.store[key]
	}

	clear() {
		this.store = {}
	}

	stop() {
		clearInterval(this.intervalId)
	}
}
