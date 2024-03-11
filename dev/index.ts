import { Wobe } from '../src'
import type { WobeResponse } from '../src/WobeResponse'

const wobe = new Wobe({
	port: 3000,
})

wobe.get('/test', (req, res) => {
	res.send('Hi')
})

wobe.start()
