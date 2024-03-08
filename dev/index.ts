import { Wobe } from '../src'
import type { WobeResponse } from '../src/WobeResponse'

const wobe = new Wobe({
	port: 3000,
	routes: [
		{
			path: '/test',
			handler: (request: Request, response: WobeResponse) => {
				response.setCookie({
					name: 'titi',
					value: 'test',
					httpOnly: true,
					secure: true,
				})

				response.setCookie({
					name: 'tata',
					value: 'tata',
				})

				console.log(response.getCookie('titi').value)
			},
			method: 'GET',
		},
	],
})
