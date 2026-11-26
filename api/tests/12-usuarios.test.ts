import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { CorreoEnUso, desconectarBD, prisma, type ProveedorIdentidad } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioConPermisos, crearUsuarioHabilitado, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L09 · Usuarios: CRUD contra Firebase (proveedor falso con espías) + MariaDB, protecciones
 * (último superadmin, uno mismo) y escalada de privilegios.
 */
const SUPER_A = 'prueba-l09-super-a'
const SUPER_B = 'prueba-l09-super-b'
const GESTOR = 'prueba-l09-gestor'
const DOMINIO = '@l09.test'

const crearCuenta = vi.fn<ProveedorIdentidad['crearCuenta']>(async (correo) => `uid-${correo}`)
const actualizarCuenta = vi.fn<ProveedorIdentidad['actualizarCuenta']>(async () => {})
const eliminarCuenta = vi.fn<ProveedorIdentidad['eliminarCuenta']>(async () => {})
const actualizarContrasena = vi.fn<ProveedorIdentidad['actualizarContrasena']>(async () => {})
const identidad: ProveedorIdentidad = { ...identidadFalsa, crearCuenta, actualizarCuenta, eliminarCuenta, actualizarContrasena }

const app = crearApp({ pingBD: async () => {}, identidad, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const como = (uid: string) => ({ Authorization: bearer(uid) })

const PLANTILLA_CAJA = [
  'productos', 'productos.existencias', 'productos.visibilidad', 'pedidos', 'pedidos.gestionar', 'pedidos.reservar',
  'facturacion', 'facturacion.emitir', 'clientes', 'clientes.gestionar',
]

let contador = 0
const nuevoCorreo = () => `u${++contador}-${Date.now()}${DOMINIO}`
const alta = (datos: Record<string, unknown> = {}, actor = SUPER_A) =>
  request(app)
    .post('/api/v1/admin/usuarios')
    .set(como(actor))
    .send({ nombre: 'Colaboradora Prueba', correo: nuevoCorreo(), rol: 'caja_inventario', activo: true, contrasena: 'Temporal2026', debeCambiarContrasena: true, ...datos })

async function limpiar() {
  await prisma.usuario.deleteMany({ where: { OR: [{ correo: { endsWith: DOMINIO } }, { firebaseUid: { in: [SUPER_A, SUPER_B, GESTOR] } }] } })
}

beforeAll(async () => {
  await sembrar(prisma)
  await limpiar()
  // Solo los superadmins de esta suite quedan activos (BD de pruebas).
  await prisma.usuario.updateMany({ where: { rol: 'superadmin' }, data: { activo: false } })
  await crearUsuarioHabilitado(SUPER_A)
  await crearUsuarioHabilitado(SUPER_B)
  // Gestor no superadmin: Ajustes + gestionar usuarios + la plantilla de Caja.
  await crearUsuarioConPermisos(GESTOR, ['ajustes', 'ajustes.usuarios', ...PLANTILLA_CAJA], 'administracion')
})

beforeEach(async () => {
  vi.clearAllMocks()
  await prisma.usuario.updateMany({ where: { firebaseUid: { in: [SUPER_A, SUPER_B] } }, data: { activo: true, rol: 'superadmin' } })
})

afterAll(async () => {
  await limpiar()
  await desconectarBD()
})

describe('Usuarios: lectura', () => {
  it('GET /usuarios lista con accesos y sin firebaseUid', async () => {
    const res = await request(app).get('/api/v1/admin/usuarios').set(como(SUPER_A))
    expect(res.status).toBe(200)
    const gestor = res.body.data.find((u: { correo: string }) => u.correo === `${GESTOR}@prueba.test`)
    expect(gestor.accesos.vistas).toEqual(['productos', 'pedidos', 'facturacion', 'clientes', 'ajustes'])
    expect(gestor).not.toHaveProperty('firebaseUid')
  })
})

describe('Usuarios: alta', () => {
  it('crea la cuenta en Firebase y el Usuario con la plantilla de su rol', async () => {
    const res = await alta()
    expect(res.status).toBe(201)
    expect(crearCuenta).toHaveBeenCalledWith(res.body.data.correo, 'Temporal2026')
    expect(res.body.data).toMatchObject({ rol: 'caja_inventario', activo: true, debeCambiarContrasena: true })
    const guardados = await prisma.usuarioPermiso.findMany({ where: { usuarioId: res.body.data.id } })
    expect(new Set(guardados.map((p) => p.permisoClave))).toEqual(new Set(PLANTILLA_CAJA))
  })

  it('un alta inactiva deshabilita la cuenta de Firebase', async () => {
    const res = await alta({ activo: false })
    expect(res.status).toBe(201)
    expect(actualizarCuenta).toHaveBeenCalledWith(`uid-${res.body.data.correo}`, { deshabilitada: true })
  })

  it('409 si el correo ya existe en la BD, sin tocar Firebase', async () => {
    const res = await alta({ correo: `${GESTOR}@prueba.test` })
    expect(res.status).toBe(409)
    expect(crearCuenta).not.toHaveBeenCalled()
  })

  it('409 si el correo ya tiene cuenta en Firebase', async () => {
    crearCuenta.mockRejectedValueOnce(new CorreoEnUso())
    const res = await alta()
    expect(res.status).toBe(409)
  })

  it('si la BD falla, borra la cuenta recién creada en Firebase (compensación)', async () => {
    crearCuenta.mockResolvedValueOnce(SUPER_B) // uid ya vinculado → la BD rechaza el insert
    const res = await alta()
    expect(res.status).toBe(409)
    expect(eliminarCuenta).toHaveBeenCalledWith(SUPER_B)
  })

  it('valida el cuerpo (400) antes de llamar al proveedor', async () => {
    const res = await alta({ contrasena: 'debil' })
    expect(res.status).toBe(400)
    expect(crearCuenta).not.toHaveBeenCalled()
  })
})

describe('Usuarios: edición, accesos y contraseña', () => {
  let id: number
  let uid: string
  beforeEach(async () => {
    const res = await alta()
    id = res.body.data.id
    uid = `uid-${res.body.data.correo}`
    vi.clearAllMocks()
  })
  const patch = (cambios: object, actor = SUPER_A) => request(app).patch(`/api/v1/admin/usuarios/${id}`).set(como(actor)).send(cambios)

  it('desactivar deshabilita en Firebase y marca inactivo; reactivar lo revierte', async () => {
    expect((await patch({ activo: false })).body.data.activo).toBe(false)
    expect(actualizarCuenta).toHaveBeenLastCalledWith(uid, { deshabilitada: true })
    expect((await patch({ activo: true })).body.data.activo).toBe(true)
    expect(actualizarCuenta).toHaveBeenLastCalledWith(uid, { deshabilitada: false })
  })

  it('un usuario desactivado pierde el acceso al panel', async () => {
    await patch({ activo: false })
    const res = await request(app).get('/api/v1/admin/sesion').set(como(uid))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('si Firebase falla, la BD se revierte', async () => {
    actualizarCuenta.mockRejectedValueOnce(new Error('caído'))
    expect((await patch({ activo: false })).status).toBe(500)
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id } })).activo).toBe(true)
  })

  it('cambiar el correo lo cambia también en Firebase', async () => {
    const correo = nuevoCorreo()
    expect((await patch({ correo })).status).toBe(200)
    expect(actualizarCuenta).toHaveBeenCalledWith(uid, { correo })
  })

  it('cambiar el rol reinicia los accesos a la plantilla del nuevo rol', async () => {
    const res = await patch({ rol: 'servicio_cliente' })
    expect(res.status).toBe(200)
    expect(res.body.data.accesos.vistas).toEqual(['productos', 'pedidos', 'clientes', 'cotizaciones', 'interacciones'])
  })

  it('PUT accesos normaliza (acciones sin vista se descartan) y persiste', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/usuarios/${id}/accesos`)
      .set(como(SUPER_A))
      .send({ vistas: ['clientes', 'productos'], acciones: ['productos.crear', 'pedidos.gestionar'] })
    expect(res.status).toBe(200)
    expect(res.body.data.accesos).toEqual({ vistas: ['productos', 'clientes'], acciones: ['productos.crear'] })
  })

  it('PUT accesos exige al menos una vista (422)', async () => {
    const res = await request(app).put(`/api/v1/admin/usuarios/${id}/accesos`).set(como(SUPER_A)).send({ vistas: [], acciones: [] })
    expect(res.status).toBe(422)
  })

  it('restablecer la contraseña usa el Admin SDK y fija el cambio obligatorio', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/usuarios/${id}/contrasena`)
      .set(como(SUPER_A))
      .send({ contrasena: 'Restablecida2026', debeCambiarContrasena: true })
    expect(res.status).toBe(204)
    expect(actualizarContrasena).toHaveBeenCalledWith(uid, 'Restablecida2026')
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id } })).debeCambiarContrasena).toBe(true)
  })
})

describe('Usuarios: eliminación', () => {
  it('con historial de inventario → 409 y no toca Firebase', async () => {
    const { body } = await alta()
    const producto = await prisma.producto.findFirstOrThrow()
    await prisma.movimientoInventario.create({ data: { productoId: producto.id, delta: 0, motivo: 'Prueba L09', usuarioId: body.data.id } })
    vi.clearAllMocks()
    try {
      const res = await request(app).delete(`/api/v1/admin/usuarios/${body.data.id}`).set(como(SUPER_A))
      expect(res.status).toBe(409)
      expect(res.body.error.message).toMatch(/desactívalo/)
      expect(eliminarCuenta).not.toHaveBeenCalled()
    } finally {
      await prisma.movimientoInventario.deleteMany({ where: { usuarioId: body.data.id } })
    }
  })

  it('sin historial: borra en la BD y después en Firebase', async () => {
    const { body } = await alta()
    vi.clearAllMocks()
    const res = await request(app).delete(`/api/v1/admin/usuarios/${body.data.id}`).set(como(SUPER_A))
    expect(res.status).toBe(204)
    expect(eliminarCuenta).toHaveBeenCalledWith(`uid-${body.data.correo}`)
    expect(await prisma.usuario.findUnique({ where: { id: body.data.id } })).toBeNull()
  })

  it('si Firebase falla al eliminar, el usuario se conserva', async () => {
    const { body } = await alta()
    eliminarCuenta.mockRejectedValueOnce(new Error('caído'))
    const res = await request(app).delete(`/api/v1/admin/usuarios/${body.data.id}`).set(como(SUPER_A))
    expect(res.status).toBe(500)
    expect(await prisma.usuario.findUnique({ where: { id: body.data.id } })).not.toBeNull()
  })
})

describe('Usuarios: protecciones', () => {
  const idDe = async (uid: string) => (await prisma.usuario.findUniqueOrThrow({ where: { firebaseUid: uid } })).id

  it('nadie se desactiva, cambia su rol, edita sus accesos ni se elimina a sí mismo (422)', async () => {
    const yo = await idDe(GESTOR)
    const base = `/api/v1/admin/usuarios/${yo}`
    expect((await request(app).patch(base).set(como(GESTOR)).send({ activo: false })).status).toBe(422)
    expect((await request(app).patch(base).set(como(GESTOR)).send({ rol: 'caja_inventario' })).status).toBe(422)
    expect((await request(app).put(`${base}/accesos`).set(como(GESTOR)).send({ vistas: ['productos'], acciones: [] })).status).toBe(422)
    expect((await request(app).delete(base).set(como(GESTOR))).status).toBe(422)
  })

  it('los accesos de un superadmin no se editan (422)', async () => {
    const res = await request(app).put(`/api/v1/admin/usuarios/${await idDe(SUPER_B)}/accesos`).set(como(SUPER_A)).send({ vistas: ['productos'], acciones: [] })
    expect(res.status).toBe(422)
  })

  it('un superadmin puede desactivar a otro mientras quede uno activo', async () => {
    const res = await request(app).patch(`/api/v1/admin/usuarios/${await idDe(SUPER_B)}`).set(como(SUPER_A)).send({ activo: false })
    expect(res.status).toBe(200)
  })

  it('dos superadmins que se desactivan a la vez: uno falla y queda uno activo', async () => {
    const [a, b] = [await idDe(SUPER_A), await idDe(SUPER_B)]
    const respuestas = await Promise.all([
      request(app).patch(`/api/v1/admin/usuarios/${b}`).set(como(SUPER_A)).send({ activo: false }),
      request(app).patch(`/api/v1/admin/usuarios/${a}`).set(como(SUPER_B)).send({ activo: false }),
    ])
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422])
    expect(respuestas.find((r) => r.status === 422)!.body.error.message).toMatch(/al menos un Super Administrador/)
    expect(await prisma.usuario.count({ where: { rol: 'superadmin', activo: true } })).toBe(1)
  })

  it('degradar a un superadmin a la vez que él degrada al otro: queda uno', async () => {
    const [a, b] = [await idDe(SUPER_A), await idDe(SUPER_B)]
    const respuestas = await Promise.all([
      request(app).patch(`/api/v1/admin/usuarios/${b}`).set(como(SUPER_A)).send({ rol: 'gerencia' }),
      request(app).patch(`/api/v1/admin/usuarios/${a}`).set(como(SUPER_B)).send({ rol: 'gerencia' }),
    ])
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422])
    expect(await prisma.usuario.count({ where: { rol: 'superadmin', activo: true } })).toBe(1)
  })
})

describe('Usuarios: escalada de privilegios', () => {
  const idDe = async (uid: string) => (await prisma.usuario.findUniqueOrThrow({ where: { firebaseUid: uid } })).id

  it('quien no es superadmin no crea superadmins (403)', async () => {
    const res = await alta({ rol: 'superadmin' }, GESTOR)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('PERMISSION_DENIED')
    expect(crearCuenta).not.toHaveBeenCalled()
  })

  it('ni crea usuarios con una plantilla que excede sus accesos (403)', async () => {
    expect((await alta({ rol: 'gerencia' }, GESTOR)).status).toBe(403)
  })

  it('pero sí con una plantilla que ya tiene', async () => {
    expect((await alta({ rol: 'caja_inventario' }, GESTOR)).status).toBe(201)
  })

  it('no otorga acciones que no tiene, aunque sí conserva las que el usuario ya tenía', async () => {
    const { body } = await alta({ rol: 'caja_inventario' }, GESTOR)
    const ruta = `/api/v1/admin/usuarios/${body.data.id}/accesos`
    const denegada = await request(app).put(ruta).set(como(GESTOR)).send({ vistas: ['productos'], acciones: ['productos.eliminar'] })
    expect(denegada.status).toBe(403)
    // El superadmin le da «tablero», que el gestor no tiene; el gestor puede guardar sin quitárselo.
    await request(app).put(ruta).set(como(SUPER_A)).send({ vistas: ['tablero', 'productos'], acciones: [] })
    const conserva = await request(app).put(ruta).set(como(GESTOR)).send({ vistas: ['tablero', 'productos', 'clientes'], acciones: [] })
    expect(conserva.status).toBe(200)
  })

  it('no edita, restablece, desactiva ni elimina a un superadmin (403)', async () => {
    const base = `/api/v1/admin/usuarios/${await idDe(SUPER_B)}`
    expect((await request(app).patch(base).set(como(GESTOR)).send({ nombre: 'Cambio' })).status).toBe(403)
    expect((await request(app).patch(base).set(como(GESTOR)).send({ activo: false })).status).toBe(403)
    expect((await request(app).put(`${base}/contrasena`).set(como(GESTOR)).send({ contrasena: 'Otra2026xx', debeCambiarContrasena: true })).status).toBe(403)
    expect((await request(app).delete(base).set(como(GESTOR))).status).toBe(403)
    expect(actualizarContrasena).not.toHaveBeenCalled()
  })

  it('no asciende a nadie a superadmin (403)', async () => {
    const { body } = await alta({ rol: 'caja_inventario' }, GESTOR)
    const res = await request(app).patch(`/api/v1/admin/usuarios/${body.data.id}`).set(como(GESTOR)).send({ rol: 'superadmin' })
    expect(res.status).toBe(403)
  })
})
