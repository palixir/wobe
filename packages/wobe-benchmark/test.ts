import { run, bench, group } from 'mitata'
import { Wobe } from 'wobe'

const wobe = new Wobe()
wobe.get('/hi', (ctx) => {
	return ctx.res.send('Hi')
})

wobe.listen(8080)

group('Test', () => {
	bench('fetch', async () => {
		await fetch('http://localhost:8080/hi')
	})
})

await run()

wobe.stop()
