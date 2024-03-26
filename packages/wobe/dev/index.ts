import { Wobe } from '../src'

const wobe = new Wobe()

wobe.get('/hi', (_, res) => {
	return res.send('hi')
})

wobe.listen(8080)
