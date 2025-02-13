process.env.NODE_TEST = 'test'
import { join } from 'node:path'
import { Wobe, uploadDirectory } from '../src'

new Wobe()
	.get('/', (ctx) => ctx.res.send('Hi'))
	.get(
		'/bucket/:filename',
		uploadDirectory({ directory: join(__dirname, '../fixtures') }),
	)
	.listen(3000)
