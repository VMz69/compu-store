import { Router, type Request } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaCrearCanal,
  esquemaEditarCanal,
  esquemaEstado,
  esquemaEtiquetaEstado,
  esquemaIdCanal,
  type CrearCanal,
  type EditarCanal,
  type EstadoPedido,
  type EtiquetaEstado,
} from './02-ajustes-ventas.schema.js'
import * as servicio from './03-ajustes-ventas.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id

// L13: los canales los usan el constructor de pedidos, Ajustes y el tablero; las etiquetas de estado,
// todas las vistas que muestran el estado de un pedido.
const puedeLeerCanales = requierePermiso('pedidos', 'ajustes', 'tablero')
const puedeLeerEstados = requierePermiso('pedidos', 'tablero', 'facturacion', 'clientes', 'cotizaciones', 'ajustes')
const puedeConfigurar = requierePermiso('ajustes.configuracion')

/** Ajustes › Canales y flujo (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterAjustesVentas(): Router {
  const router = Router()

  router.get('/canales-venta', puedeLeerCanales, async (_req, res) => {
    res.json({ data: await servicio.listarCanales() })
  })
  router.post('/canales-venta', puedeConfigurar, validar({ body: esquemaCrearCanal }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearCanal(req.body as CrearCanal) })
  })
  router.patch('/canales-venta/:id', puedeConfigurar, validar({ params: esquemaIdCanal, body: esquemaEditarCanal }), async (req, res) => {
    res.json({ data: await servicio.editarCanal(idDe(req), req.body as EditarCanal) })
  })
  router.delete('/canales-venta/:id', puedeConfigurar, validar({ params: esquemaIdCanal }), async (req, res) => {
    await servicio.eliminarCanal(idDe(req))
    res.status(204).end()
  })

  router.get('/estados-pedido', puedeLeerEstados, async (_req, res) => {
    res.json({ data: await servicio.listarEtiquetas() })
  })
  router.put('/estados-pedido/:estado', puedeConfigurar, validar({ params: esquemaEstado, body: esquemaEtiquetaEstado }), async (req, res) => {
    const { estado } = req.params as unknown as { estado: EstadoPedido }
    res.json({ data: await servicio.guardarEtiqueta(estado, req.body as EtiquetaEstado) })
  })

  return router
}
