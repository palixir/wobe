import { Wobe } from '../src'
import { logger } from '../src/hooks'

new Wobe()
	.get('/', (ctx) => ctx.res.send('Hi'))
	.post('/json', async (ctx) => {
		console.log('handler')
		const tata = await ctx.json()
		return ctx.res.send(tata)
	})
	.get('/id/:id', (ctx) => {
		ctx.res.headers.set('x-powered-by', 'benchmark')

		return ctx.res.send(1 + ' ' + 'bun')
	})
	.beforeHandler('/json', logger())
	.afterHandler(() => console.log('After handler'))
	.beforeAndAfterHandler(() => console.log('Before and after handler'))
	.useWebSocket({
		path: '/ws',
		onOpen(ws) {
			console.log('onOpen')
		},
	})
	.listen(3000)
