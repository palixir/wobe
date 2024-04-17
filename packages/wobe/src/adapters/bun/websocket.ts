import type { WebSocketHandler } from 'bun'
import type { WobeWebSocket } from '../../Wobe'

export const bunWebSocket = (webSocket?: WobeWebSocket): WebSocketHandler => {
	return {
		perMessageDeflate: true,
		maxPayloadLength: webSocket?.maxPayloadLength,
		idleTimeout: webSocket?.idleTimeout,
		backpressureLimit: webSocket?.backpressureLimit,
		closeOnBackpressureLimit: webSocket?.closeOnBackpressureLimit,
		message(ws, message) {
			webSocket?.onMessage?.(ws, message)
		},
		open(ws) {
			webSocket?.onOpen?.(ws)
		},
		close(ws, code, message) {
			webSocket?.onClose?.(ws, code, message)
		},
		drain(ws) {
			webSocket?.onDrain?.(ws)
		},
	}
}
