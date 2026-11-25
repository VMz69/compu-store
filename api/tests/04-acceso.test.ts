import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma, type ProveedorIdentidad } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { vincular } from '../src/05-pipeline-acceso/00-director-acceso.js'

/** Tokens del proveedor falso: "token-<uid>" es válido para ese uid; el resto se rechaza. */
const PREFIJO = 'token-'
const UID_ACTIVO = 'prueba-l03-activo'
const UID_INACTIVO = 'prueba-l03-inactivo'
const UID_SIN_USUARIO = 'prueba-l03-sin-usuario'
const UIDS = [UID_ACTIVO, UID_INACTIVO, UID_SIN_USUARIO]

const actualizarContrasena = vi.fn<ProveedorIdentidad['actualizarContrasena']>(async () => {})
const identidad: ProveedorIdentidad = {
  verificarToken: async (token) => {
    if (!token.startsWith(PREFIJO)) throw new Error('token inválido')
    return { uid: token.slice(PREFIJO.length), correo: null }
  },
  actualizarContrasena,
  buscarPorCorreo: async () => null,
}

const app = crearApp({ pingBD: async () => {}, identidad, origenes: [] })
const bearer = (uid: string) => `Bearer ${PREFIJO}${uid}`

async function prepararUsuarios() {
  await prisma.usuario.deleteMany({ where: { firebaseUid: { in: UIDS } } })
  await prisma.usuario.createMany({
    data: [
      { firebaseUid: UID_ACTIVO, correo: 'activo@prueba.test', nombre: 'Activa', rol: 'superadmin', debeCambiarContrasena: true },
      { firebaseUid: UID_INACTIVO, correo: 'inactivo@prueba.test', nombre: 'Inactiva', rol: 'superadmin', activo: false },
    ],
  })
}

describe('Acceso: autenticación (401)', () => {
  it('rechaza /admin/sesion sin cabecera Authorization', async () => {
    const res = await request(app).get('/api/v1/admin/sesion')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('rechaza una cabecera que no es Bearer', async () => {
    const res = await request(app).get('/api/v1/admin/sesion').set('Authorization', `Basic ${PREFIJO}${UID_ACTIVO}`)

    expect(res.status).toBe(401)
  })

  it('rechaza un token que el proveedor no acepta', async () => {
    const res = await request(app).get('/api/v1/admin/sesion').set('Authorization', 'Bearer falsificado')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('protege por defecto las rutas /admin/* inexistentes', async () => {
    const res = await request(app).get('/api/v1/admin/no-existe')

    expect(res.status).toBe(401)
  })
})

describe('Acceso: autorización y sesión', () => {
  beforeEach(async () => {
    actualizarContrasena.mockClear()
    await prepararUsuarios()
  })
  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { firebaseUid: { in: UIDS } } })
    await desconectarBD()
  })

  it('responde 403 si la identidad no está vinculada a un Usuario', async () => {
    const res = await request(app).get('/api/v1/admin/sesion').set('Authorization', bearer(UID_SIN_USUARIO))

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('responde 403 si el Usuario está desactivado', async () => {
    const res = await request(app).get('/api/v1/admin/sesion').set('Authorization', bearer(UID_INACTIVO))

    expect(res.status).toBe(403)
    expect(res.body.error.message).toMatch(/desactivada/)
  })

  it('GET /admin/sesion devuelve el contrato de sesión sin firebaseUid', async () => {
    const res = await request(app).get('/api/v1/admin/sesion').set('Authorization', bearer(UID_ACTIVO))

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({
      id: expect.any(Number),
      correo: 'activo@prueba.test',
      nombre: 'Activa',
      telefono: null,
      rol: 'superadmin',
      activo: true,
      debeCambiarContrasena: true,
      ultimoAcceso: null,
    })
  })

  it('una ruta /admin/* inexistente da 404 a un usuario habilitado', async () => {
    const res = await request(app).get('/api/v1/admin/no-existe').set('Authorization', bearer(UID_ACTIVO))

    expect(res.status).toBe(404)
  })

  it('POST /admin/sesion registra el último acceso en UTC', async () => {
    const antes = Date.now()
    const res = await request(app).post('/api/v1/admin/sesion').set('Authorization', bearer(UID_ACTIVO))

    expect(res.status).toBe(200)
    const ultimoAcceso = Date.parse(res.body.data.ultimoAcceso)
    expect(ultimoAcceso).toBeGreaterThanOrEqual(antes - 1000)
    expect(res.body.data.ultimoAcceso).toMatch(/Z$/)
  })

  it('PUT /admin/sesion/contrasena rechaza una contraseña débil sin llamar al proveedor', async () => {
    const res = await request(app)
      .put('/api/v1/admin/sesion/contrasena')
      .set('Authorization', bearer(UID_ACTIVO))
      .send({ contrasena: 'debil' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(actualizarContrasena).not.toHaveBeenCalled()
  })

  it('PUT /admin/sesion/contrasena cambia la contraseña en el proveedor y libera la obligación', async () => {
    const res = await request(app)
      .put('/api/v1/admin/sesion/contrasena')
      .set('Authorization', bearer(UID_ACTIVO))
      .send({ contrasena: 'Nueva2026!' })

    expect(res.status).toBe(204)
    expect(actualizarContrasena).toHaveBeenCalledWith(UID_ACTIVO, 'Nueva2026!')
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { firebaseUid: UID_ACTIVO } })
    expect(usuario.debeCambiarContrasena).toBe(false)
  })

  it('vincular es idempotente y no reactiva una cuenta desactivada', async () => {
    const datos = {
      firebaseUid: UID_INACTIVO,
      correo: 'inactivo@prueba.test',
      nombre: 'Renombrada',
      telefono: null,
      rol: 'superadmin',
      debeCambiarContrasena: false,
    }
    await vincular(datos)
    await vincular(datos)

    const usuarios = await prisma.usuario.findMany({ where: { firebaseUid: UID_INACTIVO } })
    expect(usuarios).toHaveLength(1)
    expect(usuarios[0]).toMatchObject({ nombre: 'Renombrada', activo: false })
  })
})
