import { Router } from 'express'
import { limiteTasa, validar } from '../04-pipeline-http/00-director-http.js'
import { esquemaValidarCarrito, type ValidarCarrito } from './02-tienda.schema.js'
import * as servicio from './03-tienda.service.js'

/** Escritura pública (§3.3): 30 validaciones por minuto e IP. */
const LIMITE_VALIDAR = { ventanaMs: 60_000, maximo: 30 }

/** Identidad pública y validación del carrito (se monta bajo /api/v1/tienda). */
export function crearRouterTienda(): Router {
  const router = Router()

  router.get('/identidad', async (_req, res) => {
    res.json({ data: await servicio.obtenerIdentidad() })
  })
  router.post('/carrito/validar', limiteTasa(LIMITE_VALIDAR), validar({ body: esquemaValidarCarrito }), async (req, res) => {
    res.json({ data: await servicio.validarCarrito((req.body as ValidarCarrito).lineas) })
  })

  return router
}
