export type Origin =
	| string
	| string[]
	| ((origin: string) => string | undefined | null)

export * from './cors'
export * from './csrf'
