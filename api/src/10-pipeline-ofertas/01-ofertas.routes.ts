import { Router, type Request } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaCrearOferta,
  esquemaEditarOferta,
  esquemaIdOferta,
  esquemaListarOfertas,
  esquemaPausa,
  type CrearOferta,
  type EditarOferta,
  type ListarOfertas,
} from './02-ofertas.schema.js'
import * as servicio from './03-ofertas.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id

// L12: las ofertas las lee la vista Ofertas y las que agregan productos con su precio vigente
// (constructores de pedidos y cotizaciones).
const puedeLeer = requierePermiso('ofertas', 'pedidos', 'cotizaciones')
const puedeGestionar = requierePermiso('ofertas.gestionar')

/** Ofertas (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterAdminOfertas(): Router {
  const router = Router()

  router.get('/ofertas', puedeLeer, validar({ query: esquemaListarOfertas }), async (req, res) => {
    res.json(await servicio.listarOfertas(req.query as unknown as ListarOfertas))
  })
  router.get('/ofertas/:id', puedeLeer, validar({ params: esquemaIdOferta }), async (req, res) => {
    res.json({ data: await servicio.obtenerOferta(idDe(req)) })
  })
  router.post('/ofertas', puedeGestionar, validar({ body: esquemaCrearOferta }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearOferta(req.body as CrearOferta) })
  })
  router.patch('/ofertas/:id', puedeGestionar, validar({ params: esquemaIdOferta, body: esquemaEditarOferta }), async (req, res) => {
    res.json({ data: await servicio.editarOferta(idDe(req), req.body as EditarOferta) })
  })
  router.patch('/ofertas/:id/pausa', puedeGestionar, validar({ params: esquemaIdOferta, body: esquemaPausa }), async (req, res) => {
    res.json({ data: await servicio.pausarOferta(idDe(req), (req.body as { pausada: boolean }).pausada) })
  })
  router.delete('/ofertas/:id', puedeGestionar, validar({ params: esquemaIdOferta }), async (req, res) => {
    await servicio.eliminarOferta(idDe(req))
    res.status(204).end()
  })

  return router
}
