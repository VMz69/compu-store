import { Router, type Request } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
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

  // L09: las métricas las muestran Productos y el Tablero.
  router.get('/inventario/metricas', requierePermiso('productos', 'tablero'), async (_req, res) => {
    res.json({ data: await servicio.metricas() })
  })

  router.post('/productos/:id/ajustes', requierePermiso('productos.existencias'), validar({ params: esquemaIdProducto, body: esquemaAjuste }), async (req, res) => {
    res.json({ data: await servicio.ajustar(idDe(req), (req.body as Ajuste).delta, usuarioDe(res).id) })
  })
  // Las existencias se guardan desde la ficha del producto, que exige «Editar productos».
  router.put('/productos/:id/existencias', requierePermiso('productos.editar'), validar({ params: esquemaIdProducto, body: esquemaExistencias }), async (req, res) => {
    res.json({ data: await servicio.editarExistencias(idDe(req), req.body as EdicionExistencias, usuarioDe(res).id) })
  })

  return router
}
