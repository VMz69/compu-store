import type { RequestHandler } from 'express'
import { ErrorApp } from './02-errores.middleware.js'

export interface OpcionesLimiteTasa {
  /** Duración de la ventana en milisegundos. */
  ventanaMs: number
  /** Peticiones permitidas por IP dentro de cada ventana. */
  maximo: number
}

/**
 * Límite de tasa para escrituras públicas (§3.3): ventana fija en memoria por IP.
 * Basta para una sola instancia (Railway); `req.ip` respeta `trust proxy` de 01-app.
 * Cada llamada crea un contador independiente (uno por ruta que lo use).
 */
export function limiteTasa({ ventanaMs, maximo }: OpcionesLimiteTasa): RequestHandler {
  const contadores = new Map<string, { inicio: number; total: number }>()
  let ultimaLimpieza = Date.now()

  return (req, _res, next) => {
    const ahora = Date.now()
    if (ahora - ultimaLimpieza >= ventanaMs) {
      for (const [ip, contador] of contadores) if (ahora - contador.inicio >= ventanaMs) contadores.delete(ip)
      ultimaLimpieza = ahora
    }

    const ip = req.ip ?? 'desconocida'
    const actual = contadores.get(ip)
    if (!actual || ahora - actual.inicio >= ventanaMs) {
      contadores.set(ip, { inicio: ahora, total: 1 })
      next()
      return
    }
    actual.total += 1
    if (actual.total > maximo) {
      next(new ErrorApp('TOO_MANY_REQUESTS', 429, 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'))
      return
    }
    next()
  }
}
