import { Router, type Request } from 'express'
import type { ProveedorIdentidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { usuarioDe } from './05-autorizacion.js'
import { requierePermiso } from './07-requiere-permiso.js'
import {
  esquemaAccesos,
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  esquemaIdUsuario,
  esquemaRestablecerContrasena,
  type AccesosEntrada,
  type CrearUsuario,
  type EditarUsuario,
  type RestablecerContrasena,
} from './09-usuarios.schema.js'
import * as servicio from './10-usuarios.service.js'

const idDe = (req: Request) => (req.params as unknown as { id: number }).id
const conId = validar({ params: esquemaIdUsuario })
const gestionar = requierePermiso('ajustes.usuarios')

/**
 * Usuarios del panel (L09, Ajustes › Usuarios). Se monta bajo /api/v1/admin.
 * La lista la ve quien tiene la vista Ajustes (modo de solo lectura del admin); el resto exige
 * «Gestionar usuarios y accesos». Las reglas de negocio viven en el service.
 */
export function crearRouterUsuarios(identidad: ProveedorIdentidad): Router {
  const router = Router()

  router.get('/usuarios', requierePermiso('ajustes'), async (_req, res) => {
    res.json({ data: await servicio.listar() })
  })
  router.post('/usuarios', gestionar, validar({ body: esquemaCrearUsuario }), async (req, res) => {
    res.status(201).json({ data: await servicio.crear(usuarioDe(res), req.body as CrearUsuario, identidad) })
  })
  router.patch('/usuarios/:id', gestionar, validar({ params: esquemaIdUsuario, body: esquemaEditarUsuario }), async (req, res) => {
    res.json({ data: await servicio.editar(usuarioDe(res), idDe(req), req.body as EditarUsuario, identidad) })
  })
  router.put('/usuarios/:id/accesos', gestionar, validar({ params: esquemaIdUsuario, body: esquemaAccesos }), async (req, res) => {
    res.json({ data: await servicio.cambiarAccesos(usuarioDe(res), idDe(req), req.body as AccesosEntrada) })
  })
  router.put(
    '/usuarios/:id/contrasena',
    gestionar,
    validar({ params: esquemaIdUsuario, body: esquemaRestablecerContrasena }),
    async (req, res) => {
      await servicio.restablecerContrasena(usuarioDe(res), idDe(req), req.body as RestablecerContrasena, identidad)
      res.status(204).end()
    },
  )
  router.delete('/usuarios/:id', gestionar, conId, async (req, res) => {
    await servicio.eliminar(usuarioDe(res), idDe(req), identidad)
    res.status(204).end()
  })

  return router
}
