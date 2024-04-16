import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	mock,
	beforeEach,
} from 'bun:test'
import { Wobe } from '../../Wobe'
import getPort from 'get-port'

const waitWebsocketOpened = (ws: WebSocket) =>
	new Promise((resolve) => {
		ws.onopen = resolve
	})

describe('Bun - websocket', () => {
	const mockOnOpen = mock(() => {})
	const mockOnMessage = mock(() => {})
	const mockOnClose = mock(() => {})
	const mockOnDrain = mock(() => {})

	let port: number
	let wobe: Wobe

	beforeAll(async () => {
		port = await getPort()

		wobe = new Wobe()

		wobe.useWebSocket({
			path: '/ws',
			onOpen: mockOnOpen,
			onMessage: mockOnMessage,
			onClose: mockOnClose,
			onDrain: mockOnDrain,
		})

		wobe.listen(port)
	})

	afterAll(() => {
		wobe.stop()
	})

	beforeEach(() => {
		mockOnOpen.mockClear()
		mockOnMessage.mockClear()
		mockOnClose.mockClear()
		mockOnDrain.mockClear()
	})

	it.only('should call onOpen when the websocket connection is opened', async () => {
		const ws = new WebSocket(`ws://localhost:${port}/ws`)

		await waitWebsocketOpened(ws)

		ws.send('Hello')

		expect(mockOnOpen).toHaveBeenCalledTimes(1)
		expect(mockOnMessage).toHaveBeenCalledTimes(0)

		ws.close()
	})

	it('should call onMessage when the websocket connection receives a message', async () => {
		const ws = new WebSocket(`ws://localhost:${port}/ws`)

		await waitWebsocketOpened(ws)

		ws.send('Hello')

		expect(mockOnMessage).toHaveBeenCalledTimes(1)
		expect(mockOnMessage).toHaveBeenCalledWith(ws, 'Hello')

		ws.close()
	})

	it('should call onClose when the websocket connection is closed', async () => {
		const ws = new WebSocket(`ws://localhost:${port}/ws`)

		await waitWebsocketOpened(ws)

		ws.close()

		expect(mockOnOpen).toHaveBeenCalledTimes(1)
		expect(mockOnClose).toHaveBeenCalledTimes(1)
	})
})
