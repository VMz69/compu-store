import { Router, type Request } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaAjuste,
  esquemaExistencias,
  esquemaIdProducto,
  type Ajuste,
  type EdicionExistencias,
} from './02-inventario.schema.js'
import * as servicio from './03-inventario.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id

/** Existencias, ajustes y métricas (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterAdminInventario(): Router {
  const router = Router()

  router.get('/inventario/metricas', async (_req, res) => {
    res.json({ data: await servicio.metricas() })
  })

  router.post('/productos/:id/ajustes', validar({ params: esquemaIdProducto, body: esquemaAjuste }), async (req, res) => {
    res.json({ data: await servicio.ajustar(idDe(req), (req.body as Ajuste).delta, usuarioDe(res).id) })
  })
  router.put('/productos/:id/existencias', validar({ params: esquemaIdProducto, body: esquemaExistencias }), async (req, res) => {
    res.json({ data: await servicio.editarExistencias(idDe(req), req.body as EdicionExistencias, usuarioDe(res).id) })
  })

  return router
}
