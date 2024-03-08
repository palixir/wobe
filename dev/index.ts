import { Wobe } from '../src'
import type { WobeResponse } from '../src/WobeResponse'

const wobe = new Wobe({
	port: 3000,
	routes: [
		{
			path: '/test',
			handler: (request: Request, response: WobeResponse) => {},
			method: 'GET',
		},
	],
})
