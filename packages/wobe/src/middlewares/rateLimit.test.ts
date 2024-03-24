import { describe, expect, it } from 'bun:test'
import { rateLimit } from './rateLimit'
import { WobeResponse } from '../WobeResponse'

describe('rateLimit', () => {
	it('should limit the number of request by second', () => {
		const request = new Request('http://localhost:3000/test')

		const wobeResponse = new WobeResponse(request)

		const handler = rateLimit({})

		handler({ request }, wobeResponse)
	})
})
