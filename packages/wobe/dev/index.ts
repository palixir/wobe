import { Wobe } from '../src'
import { rateLimit } from '../src/middlewares'

const wobe = new Wobe({
	port: 3000,
})

wobe.beforeHandler(rateLimit({}))

wobe.get('/test', (_, res) => {
	return res.send('Test')
})

wobe.start()
