import { Router } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso } from '../05-pipeline-acceso/00-director-acceso.js'
import { esquemaAjustesIdentidad, type AjustesIdentidad } from './06-ajustes.schema.js'
import * as servicio from './07-ajustes.service.js'

/**
 * Ajustes › Identidad del emisor (L10). Se monta bajo /api/v1/admin.
 * La leen las vistas que imprimen o muestran el emisor (ajustes, tablero, facturación y
 * cotizaciones); guardar exige «Editar configuración».
 */
export function crearRouterAjustes(): Router {
  const router = Router()

  router.get('/ajustes/identidad', requierePermiso('ajustes', 'tablero', 'facturacion', 'cotizaciones'), async (_req, res) => {
    res.json({ data: await servicio.obtener() })
  })
  router.put(
    '/ajustes/identidad',
    requierePermiso('ajustes.configuracion'),
    validar({ body: esquemaAjustesIdentidad }),
    async (req, res) => {
      res.json({ data: await servicio.actualizar(req.body as AjustesIdentidad) })
    },
  )

  return router
}
