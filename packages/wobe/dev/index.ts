import { Wobe } from '../src'

new Wobe()
	.get('/', (ctx) => ctx.res.send('Hi'))
	.post('/json', async (ctx) => {
		await ctx.initializeBody()
		// return ctx.res.send(ctx.request.body)
	})
	.get('/id/:id', (ctx) => {
		ctx.res.headers.set('x-powered-by', 'benchmark')

		return ctx.res.send(1 + ' ' + 'bun')
	})
	.listen(3000)
