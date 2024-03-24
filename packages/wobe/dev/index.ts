import { Wobe } from '../src'

const wobe = new Wobe({
	port: 3000,
})

wobe.get('/test', (_, res) => {
	return res.send('Test')
})

wobe.start()
