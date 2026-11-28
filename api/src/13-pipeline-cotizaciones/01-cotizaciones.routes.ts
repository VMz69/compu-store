import { Router, type Request, type Response } from 'express'
import { validar, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import { esquemaPedido, type DatosPedido } from '../11-pipeline-pedidos/00-director-pedidos.js'
import {
  esquemaCotizacion,
  esquemaEstadoCotizacion,
  esquemaIdCotizacion,
  esquemaListarCotizaciones,
  type DatosCotizacion,
  type DestinoCotizacion,
} from './02-cotizaciones.schema.js'
import * as servicio from './03-cotizaciones.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const operador = (res: Response) => {
  const { id, nombre } = usuarioDe(res)
  return { id, nombre }
}

// L16: las cotizaciones se consultan en su vista; emitir, aceptar, rechazar y eliminar exigen
// «Emitir y gestionar cotizaciones» (`canManageQuotes`). Convertir exige además registrar pedidos
// (`canChangeOrderStatus`), como `canConvert` del admin.
const puedeLeer = requierePermiso('cotizaciones')
const puedeGestionar = requierePermiso('cotizaciones.gestionar')
const puedeRegistrarPedidos = requierePermiso('pedidos.gestionar')

/** Cotizaciones (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterCotizaciones(): Router {
  const router = Router()

  router.get('/cotizaciones', puedeLeer, validar({ query: esquemaListarCotizaciones }), async (req, res) => {
    res.json(await servicio.listarCotizaciones(req.query as unknown as Paginacion))
  })
  router.get('/cotizaciones/:id', puedeLeer, validar({ params: esquemaIdCotizacion }), async (req, res) => {
    res.json({ data: await servicio.obtenerCotizacion(idDe(req)) })
  })
  router.post('/cotizaciones', puedeGestionar, validar({ body: esquemaCotizacion }), async (req, res) => {
    res.status(201).json({ data: await servicio.emitirCotizacion(req.body as DatosCotizacion, operador(res)) })
  })
  router.patch('/cotizaciones/:id/estado', puedeGestionar, validar({ params: esquemaIdCotizacion, body: esquemaEstadoCotizacion }), async (req, res) => {
    res.json({ data: await servicio.cambiarEstado(idDe(req), (req.body as { estado: DestinoCotizacion }).estado) })
  })
  router.delete('/cotizaciones/:id', puedeGestionar, validar({ params: esquemaIdCotizacion }), async (req, res) => {
    await servicio.eliminarCotizacion(idDe(req))
    res.status(204).end()
  })
  router.post(
    '/cotizaciones/:id/conversion',
    puedeGestionar,
    puedeRegistrarPedidos,
    validar({ params: esquemaIdCotizacion, body: esquemaPedido }),
    async (req, res) => {
      res.status(201).json({ data: await servicio.convertir(idDe(req), req.body as DatosPedido, operador(res)) })
    },
  )

  return router
}
