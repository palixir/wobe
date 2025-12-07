import { Elysia } from 'elysia'
import getPort from 'get-port'

export const elysiaApp = async () => {
	const port = await getPort()
	const app = new Elysia()
		.get('/', 'Hi')
		.get('/id/:id', (c) => {
			c.set.headers['x-powered-by'] = 'benchmark'

			return `${c.params.id} ${c.query.name}`
		})
		.post('/json', (c) => c.body, {
			parse: 'json',
		})
		.listen(port)

	app.stop()
}
