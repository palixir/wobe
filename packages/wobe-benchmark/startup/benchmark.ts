import { bench, run } from 'mitata'
import { elysiaApp } from './elysia'
import { wobeApp } from './wobe'

const frameworks = [
	{ name: 'elysia', fn: elysiaApp },
	{ name: 'wobe', fn: wobeApp },
]

for (const framework of frameworks) {
	bench(framework.name, async () => {
		await framework.fn()
	})
}

await run()
