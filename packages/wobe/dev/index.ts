import { Wobe } from '../src'

const wobe = new Wobe()

wobe.get('/', (_, res) => {
	return res.send('hi')
})

wobe.listen(3000)
