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
import { bunWebSocket } from './websocket'

const waitWebsocketOpened = (ws: WebSocket) =>
	new Promise((resolve) => {
		ws.onopen = resolve
	})

const waitWebsocketClosed = (ws: WebSocket) =>
	new Promise((resolve) => {
		ws.onclose = resolve
	})

describe.skipIf(process.env.NODE_TEST === 'true')('Bun - websocket', () => {
	4
	const mockOnOpen = mock(() => {})
	const mockOnMessage = mock(() => {})
	const mockOnClose = mock(() => {})
	const mockOnDrain = mock(() => {})

	let port: number
	let wobe: Wobe<any>

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

	it('should call onOpen when the websocket connection is opened', async () => {
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

	it('should not call onOpen if the pathname is wrong', async () => {
		const ws = new WebSocket(`ws://localhost:${port}/wrong`)

		await waitWebsocketClosed(ws)

		expect(mockOnOpen).toHaveBeenCalledTimes(0)
		expect(mockOnClose).toHaveBeenCalledTimes(1)
	})

	it('should have all wobe websockets options', async () => {
		const websocket = bunWebSocket({
			backpressureLimit: 1024,
			closeOnBackpressureLimit: true,
			idleTimeout: 1000,
			maxPayloadLength: 1024,
			compression: true,
		} as any)

		expect(websocket.perMessageDeflate).toBe(true)
		expect(websocket.maxPayloadLength).toBe(1024)
		expect(websocket.idleTimeout).toBe(1000)
		expect(websocket.backpressureLimit).toBe(1024)
		expect(websocket.closeOnBackpressureLimit).toBe(true)
		expect(websocket.message).toBeDefined()
		expect(websocket.open).toBeDefined()
		expect(websocket.close).toBeDefined()
		expect(websocket.drain).toBeDefined()
	})

	it('should call all beforeHandler before the websocket upgrade', async () => {
		const port2 = await getPort()

		const wobe2 = new Wobe()

		const mockBeforeHandler1 = mock(() => {})
		const mockBeforeHandler2 = mock(() => {})

		wobe2
			.useWebSocket({
				path: '/ws',
				beforeWebSocketUpgrade: [
					mockBeforeHandler1,
					mockBeforeHandler2,
				],
			})
			.listen(port2)

		const ws = new WebSocket(`ws://localhost:${port2}/ws`)

		await waitWebsocketOpened(ws)

		expect(mockBeforeHandler1).toHaveBeenCalledTimes(1)
		expect(mockBeforeHandler2).toHaveBeenCalledTimes(1)

		ws.close()

		wobe2.stop()
	})

	it('should not established the socket connection if one of the beforeSocketUpgrade failed', async () => {
		const port2 = await getPort()

		const wobe2 = new Wobe()

		const mockBeforeHandler1 = mock(() => {
			throw new Error('error')
		})
		const mockBeforeHandler2 = mock(() => {})

		wobe2
			.useWebSocket({
				path: '/ws',
				beforeWebSocketUpgrade: [
					mockBeforeHandler1,
					mockBeforeHandler2,
				],
			})
			.listen(port2)

		const ws = new WebSocket(`ws://localhost:${port2}/ws`)

		await waitWebsocketClosed(ws)

		ws.close()

		expect(mockBeforeHandler1).toHaveBeenCalledTimes(1)
		expect(mockOnOpen).toHaveBeenCalledTimes(0)
		expect(mockBeforeHandler2).toHaveBeenCalledTimes(0)

		wobe2.stop()
	})
})
