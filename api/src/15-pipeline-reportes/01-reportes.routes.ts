import { Router } from 'express'
import { esquemaPaginacion, validar, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso } from '../05-pipeline-acceso/00-director-acceso.js'
import * as servicio from './02-reportes.service.js'

// L18: el tablero se consulta en la vista Tablero; el historial de compra, en la vista Clientes (directorio).
const puedeVerTablero = requierePermiso('tablero')
const puedeVerClientes = requierePermiso('clientes')

/** Reportes (se monta bajo /api/v1/admin, ya protegido). Solo lectura. */
export function crearRouterReportes(): Router {
  const router = Router()

  router.get('/reportes/tablero', puedeVerTablero, async (_req, res) => {
    res.json({ data: await servicio.tablero() })
  })
  router.get('/reportes/clientes', puedeVerClientes, validar({ query: esquemaPaginacion }), async (req, res) => {
    res.json(await servicio.estadisticasClientes(req.query as unknown as Paginacion))
  })

  return router
}
