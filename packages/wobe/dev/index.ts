import { Wobe } from '../src'
import { logger } from '../src/middlewares'

new Wobe()
	.get('/', (ctx) => ctx.res.send('Hi'))
	.post('/json', async (ctx) => {
		console.log('handler')
		return ctx.res.send(await ctx.json())
	})
	.get('/id/:id', (ctx) => {
		ctx.res.headers.set('x-powered-by', 'benchmark')

		return ctx.res.send(1 + ' ' + 'bun')
	})
	.beforeHandler('/json', logger())
	.afterHandler(() => console.log('After handler'))
	.beforeAndAfterHandler(() => console.log('Before and after handler'))
	.listen(3000)
