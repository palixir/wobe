import type { WebSocketHandler } from 'bun'
import type { WobeWebSocket } from '../../Wobe'

export const bunWebSocket = (webSocket?: WobeWebSocket): WebSocketHandler => {
	return {
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
