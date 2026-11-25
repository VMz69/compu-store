import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

const UID = 'prueba-l04'
const PREFIJO = 'prueba-l04'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }

async function limpiar() {
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

beforeAll(async () => {
  await sembrar(prisma) // idempotente: garantiza las categorías y marcas con productos del seed
  await crearUsuarioHabilitado(UID)
  await limpiar()
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Taxonomía: protección', () => {
  it('las rutas admin exigen sesión (401)', async () => {
    expect((await request(app).get('/api/v1/admin/categorias')).status).toBe(401)
    expect((await request(app).post('/api/v1/admin/marcas').send({ nombre: 'X' })).status).toBe(401)
  })
})

describe('Categorías (admin)', () => {
  it('lista con meta de paginación y totalProductos', async () => {
    const res = await request(app).get('/api/v1/admin/categorias?limit=2&page=1').set(auth)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 })
    expect(res.body.meta.totalPages).toBe(Math.ceil(res.body.meta.total / 2))
    expect(res.body.data[0]).toEqual({
      slug: expect.any(String),
      nombre: expect.any(String),
      icono: expect.any(String),
      descripcion: expect.any(String),
      totalProductos: expect.any(Number),
    })
  })

  it('crea con slug generado (201) y agrega sufijo si el slug ya existe', async () => {
    const primera = await request(app).post('/api/v1/admin/categorias').set(auth).send({ nombre: 'Prueba L04 Ñandú' })
    expect(primera.status).toBe(201)
    expect(primera.body.data).toMatchObject({ slug: 'prueba-l04-nandu', icono: 'fa-solid fa-folder', descripcion: '', totalProductos: 0 })

    // Nombre distinto, mismo slug: "Prueba L04 Ñandú!" → prueba-l04-nandu-2
    const segunda = await request(app).post('/api/v1/admin/categorias').set(auth).send({ nombre: 'Prueba L04 Ñandú!' })
    expect(segunda.status).toBe(201)
    expect(segunda.body.data.slug).toBe('prueba-l04-nandu-2')
  })

  it('rechaza un nombre repetido sin distinguir acentos ni mayúsculas (409)', async () => {
    const res = await request(app).post('/api/v1/admin/categorias').set(auth).send({ nombre: 'prueba l04 nandu' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: 'Ya existe una categoría con ese nombre.' })
  })

  it('valida nombre, ícono, descripción y campos desconocidos (400)', async () => {
    const casos = [
      { nombre: 'ab' },
      { nombre: '!!!' },
      { nombre: 'Prueba L04 válida', icono: 'javascript:alert(1)' },
      { nombre: 'Prueba L04 válida', descripcion: 'x'.repeat(161) },
      { nombre: 'Prueba L04 válida', slug: 'otro' },
    ]
    for (const cuerpo of casos) {
      const res = await request(app).post('/api/v1/admin/categorias').set(auth).send(cuerpo)
      expect(res.status, JSON.stringify(cuerpo)).toBe(400)
    }
  })

  it('PATCH edita sin cambiar el slug', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/categorias/prueba-l04-nandu')
      .set(auth)
      .send({ nombre: 'Prueba L04 Renombrada', icono: 'fa-solid fa-laptop' })

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ slug: 'prueba-l04-nandu', nombre: 'Prueba L04 Renombrada', icono: 'fa-solid fa-laptop' })
  })

  it('PATCH no permite tomar el nombre de otra categoría (409)', async () => {
    const res = await request(app).patch('/api/v1/admin/categorias/prueba-l04-nandu-2').set(auth).send({ nombre: 'Computadoras' })

    expect(res.status).toBe(409)
  })

  it('responde 404 si la categoría no existe', async () => {
    expect((await request(app).get('/api/v1/admin/categorias/no-existe').set(auth)).status).toBe(404)
    expect((await request(app).patch('/api/v1/admin/categorias/no-existe').set(auth).send({ descripcion: 'x' })).status).toBe(404)
    expect((await request(app).delete('/api/v1/admin/categorias/no-existe').set(auth)).status).toBe(404)
  })

  it('no elimina una categoría con productos (409)', async () => {
    const res = await request(app).delete('/api/v1/admin/categorias/computadoras').set(auth)

    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/^Tiene \d+ producto\(s\)/)
    expect(await prisma.categoria.count({ where: { slug: 'computadoras' } })).toBe(1)
  })

  it('elimina una categoría vacía (204)', async () => {
    const res = await request(app).delete('/api/v1/admin/categorias/prueba-l04-nandu-2').set(auth)

    expect(res.status).toBe(204)
    expect(await prisma.categoria.count({ where: { slug: 'prueba-l04-nandu-2' } })).toBe(0)
  })
})

describe('Marcas (admin)', () => {
  it('crea una marca activa con sitio web opcional (201)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/marcas')
      .set(auth)
      .send({ nombre: 'Prueba L04 Marca', sitioWeb: 'https://www.prueba.test', descripcion: 'Demo' })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      slug: 'prueba-l04-marca',
      sitioWeb: 'https://www.prueba.test',
      icono: null,
      activa: true,
      totalProductos: 0,
    })
    expect(new Date(res.body.data.creadaEn).toISOString()).toBe(res.body.data.creadaEn)
  })

  it('rechaza un sitio web inválido (400) y un nombre repetido (409)', async () => {
    const invalida = await request(app).post('/api/v1/admin/marcas').set(auth).send({ nombre: 'Prueba L04 Otra', sitioWeb: 'ftp://x' })
    expect(invalida.status).toBe(400)

    const repetida = await request(app).post('/api/v1/admin/marcas').set(auth).send({ nombre: 'PRUEBA L04 MARCA' })
    expect(repetida.status).toBe(409)
  })

  it('PATCH con sitioWeb vacío lo deja en null', async () => {
    const res = await request(app).patch('/api/v1/admin/marcas/prueba-l04-marca').set(auth).send({ sitioWeb: '' })

    expect(res.status).toBe(200)
    expect(res.body.data.sitioWeb).toBeNull()
  })

  it('desactiva y reactiva una marca', async () => {
    const off = await request(app).patch('/api/v1/admin/marcas/prueba-l04-marca/activa').set(auth).send({ activa: false })
    expect(off.status).toBe(200)
    expect(off.body.data.activa).toBe(false)

    const publicas = await request(app).get('/api/v1/tienda/marcas')
    expect(publicas.body.data.map((m: { slug: string }) => m.slug)).not.toContain('prueba-l04-marca')

    const on = await request(app).patch('/api/v1/admin/marcas/prueba-l04-marca/activa').set(auth).send({ activa: true })
    expect(on.body.data.activa).toBe(true)
  })

  it('no elimina una marca con productos (409) y sí una vacía (204)', async () => {
    const conProductos = await prisma.marca.findFirstOrThrow({ where: { productos: { some: {} } } })
    const res = await request(app).delete(`/api/v1/admin/marcas/${conProductos.slug}`).set(auth)
    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/Desactívala/)

    expect((await request(app).delete('/api/v1/admin/marcas/prueba-l04-marca').set(auth)).status).toBe(204)
  })
})

describe('Taxonomía pública (tienda)', () => {
  it('responde sin token y no expone campos internos de la marca', async () => {
    const res = await request(app).get('/api/v1/tienda/marcas')

    expect(res.status).toBe(200)
    expect(res.body.meta).toBeDefined()
    expect(res.body.data[0]).not.toHaveProperty('activa')
    expect(res.body.data[0]).not.toHaveProperty('creadaEn')
  })

  it('cuenta solo los productos publicados', async () => {
    const producto = await prisma.producto.findFirstOrThrow({ where: { publicado: true }, include: { categoria: true } })
    const slug = producto.categoria.slug
    const contar = async (ruta: string, headers = {}) =>
      ((await request(app).get(ruta).set(headers)).body.data as { slug: string; totalProductos: number }[]).find((c) => c.slug === slug)
        ?.totalProductos

    await prisma.producto.update({ where: { id: producto.id }, data: { publicado: false } })
    try {
      const admin = await contar('/api/v1/admin/categorias', auth)
      const tienda = await contar('/api/v1/tienda/categorias')
      expect(tienda).toBe((admin ?? 0) - 1)
    } finally {
      await prisma.producto.update({ where: { id: producto.id }, data: { publicado: true } })
    }
  })
})
