import { Router, type Request, type Response } from 'express'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import { esquemaEmision, esquemaIdFactura, esquemaListarFacturas, type DatosEmision, type ListarFacturas } from './02-facturas.schema.js'
import * as servicio from './03-facturas.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const operador = (res: Response) => {
  const { id, nombre } = usuarioDe(res)
  return { id, nombre }
}

// L15: las facturas se consultan en Facturación; emitir y anular exigen «Emitir facturas» (= `canInvoice`).
const puedeLeer = requierePermiso('facturacion')
const puedeEmitir = requierePermiso('facturacion.emitir')

/** Facturas (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterFacturas(): Router {
  const router = Router()

  router.get('/facturas', puedeLeer, validar({ query: esquemaListarFacturas }), async (req, res) => {
    const { estado, ...paginacion } = req.query as unknown as ListarFacturas
    res.json(await servicio.listarFacturas(estado, paginacion))
  })
  router.get('/facturas/:id', puedeLeer, validar({ params: esquemaIdFactura }), async (req, res) => {
    res.json({ data: await servicio.obtenerFactura(idDe(req)) })
  })
  router.post('/facturas', puedeEmitir, validar({ body: esquemaEmision }), async (req, res) => {
    res.status(201).json({ data: await servicio.emitirFactura(req.body as DatosEmision, operador(res)) })
  })
  router.post('/facturas/:id/anulacion', puedeEmitir, validar({ params: esquemaIdFactura }), async (req, res) => {
    res.json({ data: await servicio.anularFactura(idDe(req), operador(res)) })
  })

  return router
}
