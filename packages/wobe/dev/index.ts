process.env.NODE_TEST = 'true'
import { Wobe } from '../src'

new Wobe().get('/', (ctx) => ctx.res.send('Hi')).listen(3000)
