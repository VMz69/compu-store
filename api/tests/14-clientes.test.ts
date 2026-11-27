import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L11 · Directorio de clientes: CRUD, teléfono único por dígitos, DUI/NIT según el tipo y
 * búsqueda paginada. Los clientes de la suite viven en la ciudad «Xlonce» y con teléfonos 99…,
 * para no chocar con el seed ni con otras suites.
 */
const UID = 'prueba-l11'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const URL = '/api/v1/admin/clientes'
const CIUDAD = 'Xlonce'

const limpiar = () => prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '99' } } })

const crear = (cuerpo: Record<string, unknown>) =>
  request(app)
    .post(URL)
    .set(auth)
    .send({ tipo: 'persona', ciudad: CIUDAD, ...cuerpo })

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Clientes: alta, edición y eliminación', () => {
  it('crea normalizando (trim, correo en minúsculas, vacíos → null) y responde el contrato', async () => {
    const res = await crear({ nombre: '  Ana Martínez  ', telefono: '9911-0001', correo: 'Ana@Correo.COM', documento: '' })
    expect(res.status).toBe(201)
    expect(res.body.data).toEqual({
      id: expect.any(Number),
      tipo: 'persona',
      nombre: 'Ana Martínez',
      documento: null,
      telefono: '9911-0001',
      correo: 'ana@correo.com',
      ciudad: CIUDAD,
      direccion: '',
      notas: '',
      activo: true,
      creadoEn: expect.any(String),
    })
    const fila = await prisma.cliente.findUniqueOrThrow({ where: { id: res.body.data.id } })
    expect(fila.telefonoNormalizado).toBe('99110001')
  })

  it('lee uno por id y da 404 si no existe', async () => {
    const { body } = await crear({ nombre: 'Lectura Uno', telefono: '9911-0002' })
    const res = await request(app).get(`${URL}/${body.data.id}`).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.data.nombre).toBe('Lectura Uno')
    expect((await request(app).get(`${URL}/999999`).set(auth)).status).toBe(404)
    expect((await request(app).get(`${URL}/abc`).set(auth)).status).toBe(400)
  })

  it('409 si el teléfono ya existe con otro formato (también inactivo)', async () => {
    await crear({ nombre: 'Primero Tel', telefono: '9911-0003', activo: false })
    const res = await crear({ nombre: 'Segundo Tel', telefono: '99110003' })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: 'Ya hay un cliente con este teléfono.' })
  })

  it('valida DUI para personas y NIT para empresas', async () => {
    const malDui = await crear({ nombre: 'Doc Persona', telefono: '9911-0004', documento: '0614-250318-102-3' })
    expect(malDui.status).toBe(400)
    expect(malDui.body.error.details).toEqual([{ campo: 'documento', mensaje: 'Formato DUI: 01234567-8' }])
    const malNit = await crear({ tipo: 'empresa', nombre: 'Doc Empresa', telefono: '9911-0004', documento: '01234567-8' })
    expect(malNit.status).toBe(400)
    expect((await crear({ tipo: 'empresa', nombre: 'Doc Empresa', telefono: '9911-0004', documento: '0614-250318-102-3' })).status).toBe(201)
    expect((await crear({ nombre: 'Doc Persona', telefono: '9911-0005', documento: '01234567-8' })).status).toBe(201)
  })

  it('400 con datos inválidos o campos que el navegador no debe enviar', async () => {
    const casos = [
      { nombre: 'Ab', telefono: '9911-0006' },
      { nombre: 'Teléfono Malo', telefono: '99-11' },
      { nombre: 'Correo Malo', telefono: '9911-0006', correo: 'no-es-correo' },
      { nombre: 'Tipo Malo', telefono: '9911-0006', tipo: 'gobierno' },
      { nombre: 'Con Id', telefono: '9911-0006', id: 5 },
      { nombre: 'Con Fecha', telefono: '9911-0006', creadoEn: '2020-01-01T00:00:00.000Z' },
    ]
    for (const cuerpo of casos) expect((await crear(cuerpo)).status).toBe(400)
  })

  it('edita parcialmente: teléfono libre, 409 si es de otro, y el documento contra el tipo resultante', async () => {
    const { body } = await crear({ nombre: 'Para Editar', telefono: '9911-0007', documento: '01234567-8' })
    const id = body.data.id as number
    const editar = (cambios: Record<string, unknown>) => request(app).patch(`${URL}/${id}`).set(auth).send(cambios)

    const ok = await editar({ nombre: 'Editado', telefono: '9911 0077', activo: false, notas: 'Nota interna' })
    expect(ok.status).toBe(200)
    expect(ok.body.data).toMatchObject({ nombre: 'Editado', telefono: '9911 0077', activo: false, notas: 'Nota interna', documento: '01234567-8' })
    expect((await prisma.cliente.findUniqueOrThrow({ where: { id } })).telefonoNormalizado).toBe('99110077')

    expect((await editar({ telefono: '9911-0077' })).status).toBe(200) // su propio teléfono
    expect((await editar({ telefono: '9911-0001' })).status).toBe(409) // el de Ana
    expect((await editar({ tipo: 'empresa' })).status).toBe(400) // conserva un DUI
    expect((await editar({ tipo: 'empresa', documento: null })).body.data).toMatchObject({ tipo: 'empresa', documento: null })
    expect((await request(app).patch(`${URL}/999999`).set(auth).send({ nombre: 'Nadie' })).status).toBe(404)
  })

  it('elimina (204) y luego da 404', async () => {
    const { body } = await crear({ nombre: 'Para Borrar', telefono: '9911-0008' })
    expect((await request(app).delete(`${URL}/${body.data.id}`).set(auth)).status).toBe(204)
    expect(await prisma.cliente.findUnique({ where: { id: body.data.id } })).toBeNull()
    expect((await request(app).delete(`${URL}/${body.data.id}`).set(auth)).status).toBe(404)
  })
})

describe('Clientes: búsqueda paginada', () => {
  let idBusqueda = 0

  beforeAll(async () => {
    const { body } = await crear({ nombre: 'Rocío Peña Búsqueda', telefono: '9922-3344', correo: 'rocio@busqueda.sv' })
    idBusqueda = body.data.id
    await crear({ tipo: 'empresa', nombre: 'Búsqueda Empresa SA', telefono: '9922-5566', activo: false })
  })

  const buscar = async (query: Record<string, string | number>) => {
    const res = await request(app).get(URL).set(auth).query(query)
    expect(res.status).toBe(200)
    return res.body as { data: { id: number; nombre: string }[]; meta: Record<string, number> }
  }
  const nombres = (r: { data: { nombre: string }[] }) => r.data.map((c) => c.nombre)

  it('sin acentos ni mayúsculas y con varias palabras (todas deben coincidir)', async () => {
    expect(nombres(await buscar({ q: 'ROCIO pena' }))).toEqual(['Rocío Peña Búsqueda'])
    expect(nombres(await buscar({ q: 'rocio empresa' }))).toEqual([])
    expect(nombres(await buscar({ q: `busqueda ${CIUDAD}` })).sort()).toEqual(['Búsqueda Empresa SA', 'Rocío Peña Búsqueda'])
  })

  it('por correo, por dígitos del teléfono (con o sin guion) y por id visible CLI-###', async () => {
    expect(nombres(await buscar({ q: 'rocio@busqueda' }))).toEqual(['Rocío Peña Búsqueda'])
    expect(nombres(await buscar({ q: '22334' }))).toEqual(['Rocío Peña Búsqueda'])
    expect(nombres(await buscar({ q: '9922-33' }))).toEqual(['Rocío Peña Búsqueda'])
    const cli = `CLI-${String(idBusqueda).padStart(3, '0')}`
    expect((await buscar({ q: cli })).data.map((c) => c.id)).toContain(idBusqueda)
  })

  it('los comodines de LIKE se buscan literalmente', async () => {
    expect((await buscar({ q: `% ${CIUDAD}` })).data).toEqual([])
    expect((await buscar({ q: `_ ${CIUDAD}` })).data).toEqual([])
  })

  it('filtra por tipo y estado', async () => {
    expect(nombres(await buscar({ q: 'busqueda', tipo: 'empresa' }))).toEqual(['Búsqueda Empresa SA'])
    expect(nombres(await buscar({ q: 'busqueda', estado: 'activos' }))).toEqual(['Rocío Peña Búsqueda'])
    expect(nombres(await buscar({ q: 'busqueda', estado: 'inactivos' }))).toEqual(['Búsqueda Empresa SA'])
    expect((await request(app).get(URL).set(auth).query({ estado: 'todos' })).status).toBe(400)
  })

  it('pagina con meta (D-06) y los más recientes primero', async () => {
    const total = await prisma.cliente.count({ where: { ciudad: CIUDAD } })
    const p1 = await buscar({ q: CIUDAD, limit: 2, page: 1 })
    expect(p1.meta).toEqual({ page: 1, limit: 2, total, totalPages: Math.ceil(total / 2) })
    expect(p1.data).toHaveLength(2)
    expect(p1.data[0]?.nombre).toBe('Búsqueda Empresa SA') // el último creado
    const ultima = await buscar({ q: CIUDAD, limit: 2, page: p1.meta.totalPages ?? 1 })
    expect(ultima.data.length).toBe(total - 2 * ((p1.meta.totalPages ?? 1) - 1))
    expect((await request(app).get(URL).set(auth).query({ limit: 101 })).status).toBe(400)
  })
})
