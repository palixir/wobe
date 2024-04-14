import type { WobeOptions } from '../Wobe'
import type { RadixTree } from '../router'

export * from './bun'
export * from './node'

export interface RuntimeAdapter {
	createServer: (
		port: number,
		router: RadixTree,
		options?: WobeOptions,
	) => any

	stopServer: (server: any) => void
}
