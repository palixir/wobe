import { Wobe } from 'wobe'
import getPort from 'get-port'

export const wobeApp = async () => {
	const port = await getPort()
	const wobe = new Wobe()
		.get('/', (ctx) => ctx.res.sendText('Hi'))
		.post('/json', async (ctx) => {
			return ctx.res.sendJson((await ctx.request.json()) as any)
		})
		.get('/id/:id', (ctx) => {
			ctx.res.headers.set('x-powered-by', 'benchmark')

			return ctx.res.sendText(ctx.params.id + ' ' + ctx.query.name)
		})
		.listen(port)

	wobe.stop()
}
