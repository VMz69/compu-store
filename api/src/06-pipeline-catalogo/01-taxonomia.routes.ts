import { Router, type Request } from 'express'
import { esquemaPaginacion, validar, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import {
  esquemaActivarMarca,
  esquemaCrearCategoria,
  esquemaCrearMarca,
  esquemaEditarCategoria,
  esquemaEditarMarca,
  esquemaSlug,
  type CrearCategoria,
  type CrearMarca,
  type EditarCategoria,
  type EditarMarca,
} from './02-taxonomia.schema.js'
import * as servicio from './03-taxonomia.service.js'

const slugDe = (req: Request) => (req.params as { slug: string }).slug
const paginacionDe = (req: Request) => req.query as unknown as Paginacion

const conPaginacion = validar({ query: esquemaPaginacion })
const conSlug = validar({ params: esquemaSlug })

/** CRUD de categorías y marcas (se monta bajo /api/v1/admin, ya protegido). */
export function crearRouterAdminTaxonomia(): Router {
  const router = Router()

  router.get('/categorias', conPaginacion, async (req, res) => {
    res.json(await servicio.listarCategorias(paginacionDe(req), false))
  })
  router.get('/categorias/:slug', conSlug, async (req, res) => {
    res.json({ data: await servicio.obtenerCategoria(slugDe(req)) })
  })
  router.post('/categorias', validar({ body: esquemaCrearCategoria }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearCategoria(req.body as CrearCategoria) })
  })
  router.patch('/categorias/:slug', validar({ params: esquemaSlug, body: esquemaEditarCategoria }), async (req, res) => {
    res.json({ data: await servicio.editarCategoria(slugDe(req), req.body as EditarCategoria) })
  })
  router.delete('/categorias/:slug', conSlug, async (req, res) => {
    await servicio.eliminarCategoria(slugDe(req))
    res.status(204).end()
  })

  router.get('/marcas', conPaginacion, async (req, res) => {
    res.json(await servicio.listarMarcas(paginacionDe(req)))
  })
  router.get('/marcas/:slug', conSlug, async (req, res) => {
    res.json({ data: await servicio.obtenerMarca(slugDe(req)) })
  })
  router.post('/marcas', validar({ body: esquemaCrearMarca }), async (req, res) => {
    res.status(201).json({ data: await servicio.crearMarca(req.body as CrearMarca) })
  })
  router.patch('/marcas/:slug/activa', validar({ params: esquemaSlug, body: esquemaActivarMarca }), async (req, res) => {
    res.json({ data: await servicio.activarMarca(slugDe(req), (req.body as { activa: boolean }).activa) })
  })
  router.patch('/marcas/:slug', validar({ params: esquemaSlug, body: esquemaEditarMarca }), async (req, res) => {
    res.json({ data: await servicio.editarMarca(slugDe(req), req.body as EditarMarca) })
  })
  router.delete('/marcas/:slug', conSlug, async (req, res) => {
    await servicio.eliminarMarca(slugDe(req))
    res.status(204).end()
  })

  return router
}

/** Lectura pública (se monta bajo /api/v1/tienda): categorías y marcas activas con productos publicados. */
export function crearRouterTiendaTaxonomia(): Router {
  const router = Router()
  router.get('/categorias', conPaginacion, async (req, res) => {
    res.json(await servicio.listarCategorias(paginacionDe(req), true))
  })
  router.get('/marcas', conPaginacion, async (req, res) => {
    res.json(await servicio.listarMarcasPublicas(paginacionDe(req)))
  })
  return router
}
