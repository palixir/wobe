import { Wobe } from '../src'

const wobe = new Wobe()

wobe.get('/', (ctx) => {
	return ctx.res.send('hi')
})

wobe.listen(3000)
