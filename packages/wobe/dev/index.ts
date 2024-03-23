import { Wobe } from '../src'

const wobe = new Wobe({
	port: 3000,
})

wobe.get('/hi', (_, res) => {
	return res.send('Hi')
})

wobe.start()
