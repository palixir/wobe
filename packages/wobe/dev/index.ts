process.env.NODE_TEST = 'test'
import { join } from 'node:path'
import { Wobe, uploadDirectory, html } from '../src'

const staticRoot = join(__dirname, '../fixtures')

new Wobe()
	// Sample API route
	.get('/api', (ctx) => ctx.res.send('Hi'))
	// Example of using the uploadDirectory hook
	.get('/bucket/:filename', uploadDirectory({ directory: staticRoot }))
	// Serve static assets and fallback to testFile.html for SPA-style routing
	.get(
		'/tata/*',
		html({
			rootPath: staticRoot,
			fallbackFile: 'testFile.html',
			stripPrefix: '/tata',
		}),
	)
	.listen(3000)
