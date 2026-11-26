import express, { Router, type Request, type RequestHandler } from 'express'
import type { ProveedorImagenes } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp, esquemaPaginacion, validar, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { requierePermiso, usuarioDe } from '../05-pipeline-acceso/00-director-acceso.js'
import {
  esquemaConsultaTienda,
  esquemaCrearProducto,
  esquemaEditarProducto,
  esquemaIdImagen,
  esquemaIdProducto,
  esquemaPublicado,
  esquemaRelacionados,
  type ConsultaTienda,
  type CrearProducto,
  type EditarProducto,
} from './06-productos.schema.js'
import * as servicio from './07-productos.service.js'
import * as imagenes from './09-imagenes.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const paginacionDe = (req: Request) => req.query as unknown as Paginacion

const conPaginacion = validar({ query: esquemaPaginacion })
const conId = validar({ params: esquemaIdProducto })

/** Lee el binario de la imagen (D-17); un cuerpo mayor al límite responde con el mensaje que ve el admin. */
const leerImagen = express.raw({ type: [...imagenes.TIPOS_IMAGEN], limit: imagenes.MAX_BYTES_IMAGEN })
const cuerpoImagen: RequestHandler = (req, res, next) => {
  leerImagen(req, res, (error?: unknown) => {
    const demasiadoGrande = (error as { type?: string } | undefined)?.type === 'entity.too.large'
    next(demasiadoGrande ? new ErrorApp('VALIDATION_ERROR', 400, imagenes.MENSAJE_LIMITE_IMAGEN) : error)
  })
}

/** CRUD de productos y subida de imágenes (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterAdminProductos(proveedor: ProveedorImagenes): Router {
  const router = Router()

  // L09: el tablero también lee los productos; las imágenes se suben al crear o editar.
  router.get('/productos', requierePermiso('productos', 'tablero'), conPaginacion, async (req, res) => {
    res.json(await servicio.listar(paginacionDe(req)))
  })
  router.get('/productos/:id', requierePermiso('productos', 'tablero'), conId, async (req, res) => {
    res.json({ data: await servicio.obtener(idDe(req)) })
  })
  router.post('/productos', requierePermiso('productos.crear'), validar({ body: esquemaCrearProducto }), async (req, res) => {
    res.status(201).json({ data: await servicio.crear(req.body as CrearProducto, usuarioDe(res).id) })
  })
  router.patch(
    '/productos/:id/publicado',
    requierePermiso('productos.visibilidad'),
    validar({ params: esquemaIdProducto, body: esquemaPublicado }),
    async (req, res) => {
      res.json({ data: await servicio.publicar(idDe(req), (req.body as { publicado: boolean }).publicado) })
    },
  )
  router.patch('/productos/:id', requierePermiso('productos.editar'), validar({ params: esquemaIdProducto, body: esquemaEditarProducto }), async (req, res) => {
    res.json({ data: await servicio.editar(proveedor, idDe(req), req.body as EditarProducto) })
  })
  router.delete('/productos/:id', requierePermiso('productos.eliminar'), conId, async (req, res) => {
    await servicio.eliminar(proveedor, idDe(req))
    res.status(204).end()
  })

  router.post('/imagenes', requierePermiso('productos.crear', 'productos.editar'), cuerpoImagen, async (req, res) => {
    res.status(201).json({ data: await imagenes.subir(proveedor, req.body, req.get('content-type')) })
  })
  router.delete('/imagenes/:id', requierePermiso('productos.crear', 'productos.editar'), validar({ params: esquemaIdImagen }), async (req, res) => {
    await imagenes.descartar(proveedor, idDe(req))
    res.status(204).end()
  })

  return router
}

/** Lectura pública (se monta bajo /api/v1/tienda): solo productos publicados. */
export function crearRouterTiendaProductos(): Router {
  const router = Router()
  router.get('/productos', validar({ query: esquemaConsultaTienda }), async (req, res) => {
    res.json(await servicio.listarPublicos(req.query as unknown as ConsultaTienda))
  })
  router.get('/productos/:id', conId, async (req, res) => {
    res.json({ data: await servicio.obtenerPublico(idDe(req)) })
  })
  router.get('/productos/:id/relacionados', validar({ params: esquemaIdProducto, query: esquemaRelacionados }), async (req, res) => {
    const { limit } = req.query as unknown as { limit: number }
    res.json({ data: await servicio.relacionados(idDe(req), limit) })
  })
  return router
}
