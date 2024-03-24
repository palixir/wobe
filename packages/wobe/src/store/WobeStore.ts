export interface WobeStoreOptions {
	interval: number
}

export class WobeStore {
	private options: WobeStoreOptions
	private store: Map<string, any>

	constructor(options: WobeStoreOptions) {
		this.options = options
		this.store = new Map()

		this._init()
	}

	_init() {
		setInterval(() => {
			this.store.clear()
		}, this.options.interval)
	}

	set(key: string, value: any) {
		this.store.set(key, value)
	}

	get(key: string): any {
		return this.store.get(key)
	}

	clear() {
		this.store.clear()
	}
}
