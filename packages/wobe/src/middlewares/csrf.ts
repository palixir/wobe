import type { Origin } from '.'
import type { WobeHandler } from '../Wobe'

export interface CsrfOptions {
  origin: Origin
}

const isSameOrigin = (optsOrigin: Origin, requestOrigin: string) => {
  if (typeof optsOrigin === 'string') return optsOrigin === requestOrigin

  if (typeof optsOrigin === 'function') return optsOrigin(requestOrigin)

  return optsOrigin.includes(requestOrigin)
}


export const csrf = (options?: CsrfOptions): WobeHandler => {
  return (req, res) => {
    const requestOrigin = req.headers.get('origin') || ''


    if (isSameOrigin(options?.origin, requestOrigin))
	}
}
