import { Router, type Request } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaCrearCliente,
  esquemaEditarCliente,
  esquemaIdCliente,
  esquemaListarClientes,
  type CrearCliente,
  type EditarCliente,
  type ListarClientes,
} from './02-clientes.schema.js'
import * as servicio from './03-clientes.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id

// L11: el directorio lo leen la vista Clientes y las que eligen cliente (pedidos, cotizaciones)
// o precargan sus datos fiscales (facturación).
const puedeLeer = requierePermiso('clientes', 'pedidos', 'cotizaciones', 'facturacion')
const puedeGestionar = requierePermiso('clientes.gestionar')
const puedeEliminar = requierePermiso('clientes.eliminar')

/** Directorio de clientes (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterClientes(): Router {
  const router = Router()

  router.get('/clientes', puedeLeer, validar({ query: esquemaListarClientes }), async (req, res) => {
    const { page, limit, ...filtro } = req.query as unknown as ListarClientes
    res.json(await servicio.listarClientes(filtro, { page, limit }))
  })
  router.get('/clientes/:id', puedeLeer, validar({ params: esquemaIdCliente }), async (req, res) => {
    res.json({ data: await servicio.obtenerCliente(idDe(req)) })
  })
  router.post('/clientes', puedeGestionar, validar({ body: esquemaCrearCliente }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearCliente(req.body as CrearCliente) })
  })
  router.patch('/clientes/:id', puedeGestionar, validar({ params: esquemaIdCliente, body: esquemaEditarCliente }), async (req, res) => {
    res.json({ data: await servicio.editarCliente(idDe(req), req.body as EditarCliente) })
  })
  router.delete('/clientes/:id', puedeEliminar, validar({ params: esquemaIdCliente }), async (req, res) => {
    await servicio.eliminarCliente(idDe(req))
    res.status(204).end()
  })

  return router
}
