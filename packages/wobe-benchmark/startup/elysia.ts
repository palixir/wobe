import { Elysia } from 'elysia'
import getPort from 'get-port'

export const elysiaApp = async () => {
	const port = await getPort()
	const elysia = new Elysia({ precompile: true })
		.get('/', 'Hi')
		.post('/json', (c) => c.body, {
			type: 'json',
		})
		.get('/id/:id', ({ set, params: { id }, query: { name } }) => {
			set.headers['x-powered-by'] = 'benchmark'

			return id + ' ' + name
		})
		.listen(port)

	elysia.stop()
}
