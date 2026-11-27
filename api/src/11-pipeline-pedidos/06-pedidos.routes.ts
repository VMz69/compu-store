import { Router, type Request, type Response } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaCambioEstado,
  esquemaEliminarPedido,
  esquemaIdPedido,
  esquemaListarPedidos,
  esquemaPedido,
  type CambioEstado,
  type DatosPedido,
  type ListarPedidos,
} from './07-pedidos.schema.js'
import * as servicio from './08-pedidos.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const operador = (res: Response): servicio.Operador => {
  const { id, nombre } = usuarioDe(res)
  return { id, nombre }
}

// L13: los pedidos los leen Pedidos y las vistas que los resumen o enlazan (tablero, facturación,
// métricas de clientes y conversión de cotizaciones).
const puedeLeer = requierePermiso('pedidos', 'tablero', 'facturacion', 'clientes', 'cotizaciones')
const puedeGestionar = requierePermiso('pedidos.gestionar')
const puedeEliminar = requierePermiso('pedidos.eliminar')

/** Pedidos (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterPedidos(): Router {
  const router = Router()

  router.get('/pedidos', puedeLeer, validar({ query: esquemaListarPedidos }), async (req, res) => {
    const { estado, ...paginacion } = req.query as unknown as ListarPedidos
    res.json(await servicio.listarPedidos(estado, paginacion))
  })
  router.get('/pedidos/:id', puedeLeer, validar({ params: esquemaIdPedido }), async (req, res) => {
    res.json({ data: await servicio.obtenerPedido(idDe(req)) })
  })
  router.post('/pedidos', puedeGestionar, validar({ body: esquemaPedido }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearPedido(req.body as DatosPedido, operador(res)) })
  })
  router.patch('/pedidos/:id', puedeGestionar, validar({ params: esquemaIdPedido, body: esquemaPedido }), async (req, res) => {
    res.json({ data: await servicio.editarPedido(idDe(req), req.body as DatosPedido, operador(res)) })
  })
  router.patch('/pedidos/:id/estado', puedeGestionar, validar({ params: esquemaIdPedido, body: esquemaCambioEstado }), async (req, res) => {
    res.json({ data: await servicio.cambiarEstado(idDe(req), req.body as CambioEstado, operador(res)) })
  })
  router.delete('/pedidos/:id', puedeEliminar, validar({ params: esquemaIdPedido, body: esquemaEliminarPedido }), async (req, res) => {
    await servicio.eliminarPedido(idDe(req), (req.body as { motivo: string }).motivo, operador(res))
    res.status(204).end()
  })

  return router
}
