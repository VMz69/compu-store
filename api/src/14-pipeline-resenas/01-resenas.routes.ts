import { Router, type Request, type Response } from 'express'
import { esquemaPaginacion, limiteTasa, validar, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaAprobarResenas,
  esquemaEnviarResena,
  esquemaIdProductoResenas,
  esquemaIdResena,
  esquemaListarResenas,
  esquemaModerarResena,
  type EnviarResena,
  type ListarResenas,
  type ModerarResena,
} from './02-resenas.schema.js'
import * as servicio from './03-resenas.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const operador = (res: Response) => {
  const { id, nombre } = usuarioDe(res)
  return { id, nombre }
}

/**
 * Antispam (D-13, decisión del propietario en L17): límite de tasa por IP + duplicados (en el service),
 * sin honeypot. 5 envíos cada 10 minutos por IP.
 */
const LIMITE_ENVIAR = { ventanaMs: 10 * 60_000, maximo: 5 }

/** Reseñas públicas de un producto (se monta bajo /api/v1/tienda). */
export function crearRouterTiendaResenas(): Router {
  const router = Router()

  router.get('/productos/:id/resenas', validar({ params: esquemaIdProductoResenas, query: esquemaPaginacion }), async (req, res) => {
    res.json(await servicio.listarAprobadas(idDe(req), req.query as unknown as Paginacion))
  })
  router.post(
    '/productos/:id/resenas',
    limiteTasa(LIMITE_ENVIAR),
    validar({ params: esquemaIdProductoResenas, body: esquemaEnviarResena }),
    async (req, res) => {
      res.status(201).json({ data: await servicio.enviar(idDe(req), req.body as EnviarResena) })
    },
  )

  return router
}

// L17: la bandeja se consulta en la vista Interacciones; aprobar, rechazar y eliminar exigen
// «Moderar comentarios» (`canModerateReviews`).
const puedeLeer = requierePermiso('interacciones')
const puedeModerar = requierePermiso('interacciones.moderar')

/** Moderación de reseñas (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterResenas(): Router {
  const router = Router()

  router.get('/resenas', puedeLeer, validar({ query: esquemaListarResenas }), async (req, res) => {
    res.json(await servicio.listar(req.query as unknown as ListarResenas))
  })
  router.post('/resenas/aprobacion', puedeModerar, validar({ body: esquemaAprobarResenas }), async (req, res) => {
    res.json({ data: await servicio.aprobarVarias((req.body as { ids: number[] }).ids, operador(res)) })
  })
  router.patch('/resenas/:id/estado', puedeModerar, validar({ params: esquemaIdResena, body: esquemaModerarResena }), async (req, res) => {
    res.json({ data: await servicio.moderar(idDe(req), req.body as ModerarResena, operador(res)) })
  })
  router.delete('/resenas/:id', puedeModerar, validar({ params: esquemaIdResena }), async (req, res) => {
    await servicio.eliminar(idDe(req))
    res.status(204).end()
  })

  return router
}
