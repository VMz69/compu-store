import { Router } from 'express'
import type { ProveedorIdentidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { validar } from '../04-pipeline-http/00-director-http.js'
import { esquemaCambioContrasena, type CambioContrasena } from './02-acceso.schema.js'
import { aSesion, cambiarContrasena, iniciarSesion } from './03-acceso.service.js'
import { usuarioDe } from './05-autorizacion.js'

/**
 * Sesión del colaborador autenticado (se monta bajo /api/v1/admin, ya protegido).
 * - GET  /sesion            → restaurar sesión (solo lectura).
 * - POST /sesion            → inicio de sesión: registra el último acceso.
 * - PUT  /sesion/contrasena → cambio de la contraseña propia (204).
 */
export function crearRouterSesion(identidad: Pick<ProveedorIdentidad, 'actualizarContrasena'>): Router {
  const router = Router()

  router.get('/sesion', async (_req, res) => {
    res.json({ data: await aSesion(usuarioDe(res)) })
  })

  router.post('/sesion', async (_req, res) => {
    res.json({ data: await iniciarSesion(usuarioDe(res)) })
  })

  router.put('/sesion/contrasena', validar({ body: esquemaCambioContrasena }), async (req, res) => {
    const { contrasena } = req.body as CambioContrasena
    await cambiarContrasena(usuarioDe(res), contrasena, identidad)
    res.status(204).end()
  })

  return router
}
