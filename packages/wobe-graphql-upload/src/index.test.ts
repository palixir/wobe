import { beforeAll, afterAll, describe, expect, it } from 'bun:test'
import { Wobe } from 'wobe'
import getPort from 'get-port'
import { wobeGraphqlUpload } from '.'

describe('Graphql upload', () => {
	let port: number
	let wobe: Wobe

	beforeAll(async () => {
		port = await getPort()
		wobe = new Wobe()

		wobe.post(
			'/test',
			(ctx) => {
				return ctx.res.send('ok')
			},
			wobeGraphqlUpload(),
		)

		wobe.listen(port)
	})

	afterAll(() => {
		wobe.stop()
	})

	it('should upload a file with a multipart request', async () => {
		const body = new FormData()

		body.append('operations', JSON.stringify({ variables: { file: null } }))
		body.append('map', JSON.stringify({ 1: ['variables.file'] }))
		body.append('1', new Blob(['Hello world']), {
			filename: 'a.txt',
		})

		const response = await fetch(`http://127.0.0.1:${port}/test`, {
			method: 'POST',
			body,
		})

		console.log(await response.text())

		// expect(response.status).toBe(200)
		// expect(await response.text()).toBe('ok')
	})
})
