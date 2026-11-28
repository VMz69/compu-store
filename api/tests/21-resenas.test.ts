import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L17 · Reseñas (40, 41, 53, 54): envío público que entra «pendiente» con antispam (D-13: límite de tasa
 * por IP y duplicados, sin honeypot), moderación en el admin y publicación: la tienda y la calificación
 * del catálogo solo cuentan las aprobadas. Datos con el prefijo «prueba-l17».
 * Cada app tiene su propio límite de tasa (5 envíos por IP cada 10 min): las pruebas que envían usan una nueva.
 */
const UID = 'prueba-l17'
const PREFIJO = 'prueba-l17'
const nuevaApp = () => crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const admin = nuevaApp()
const auth = { Authorization: bearer(UID) }
const RESENAS = '/api/v1/admin/resenas'
const tienda = (productoId: number) => `/api/v1/tienda/productos/${productoId}/resenas`

let categoriaId = 0
let marcaId = 0
let secuencia = 0

async function crearProducto(publicado = true) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L17-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre: `Prueba L17 producto ${secuencia}`,
      categoriaId,
      marcaId,
      modelo: '',
      precio: '10.00',
      stock: 1,
      publicado,
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
    },
  })
}

const opinion = (extra: Record<string, unknown> = {}) => ({
  calificacion: 5,
  autor: 'Daniela P.',
  ciudad: 'Cojutepeque',
  comentario: `Llegó impecable y funciona muy bien (${Math.random()}).`,
  ...extra,
})

/** Reseña ya existente (sin pasar por el límite de tasa). */
const sembrarResena = (producto: { id: number; sku: string; nombre: string }, calificacion: number, estado: 'pendiente' | 'aprobada' | 'rechazada' = 'pendiente') =>
  prisma.resena.create({
    data: {
      productoId: producto.id,
      productoSku: producto.sku,
      productoNombre: producto.nombre,
      autor: 'Cliente L17',
      ciudad: 'San Salvador',
      calificacion,
      comentario: 'Comentario de prueba suficientemente largo.',
      estado,
    },
  })

const moderar = (id: number, cuerpo: Record<string, unknown>) => request(admin).patch(`${RESENAS}/${id}/estado`).set(auth).send(cuerpo)
const publicas = async (productoId: number) => (await request(admin).get(tienda(productoId))).body.data as { id: number }[]
const fichaPublica = async (productoId: number) => (await request(admin).get(`/api/v1/tienda/productos/${productoId}`)).body.data

async function limpiar() {
  await prisma.resena.deleteMany({ where: { productoNombre: { startsWith: 'Prueba L17' } } })
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L17 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L17 Marca', descripcion: '' } })).id
})
afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('L17 · envío público', () => {
  it('entra pendiente con el snapshot del producto, no se publica y no cuenta en la calificación', async () => {
    const p = await crearProducto()
    const res = await request(nuevaApp()).post(tienda(p.id)).send(opinion({ autor: '  Kevin R.  ', ciudad: '' }))

    expect(res.status).toBe(201)
    expect(res.body.data).toEqual({ estado: 'pendiente' })
    const guardada = await prisma.resena.findFirstOrThrow({ where: { productoId: p.id } })
    const { pais } = await prisma.configuracionTienda.findUniqueOrThrow({ where: { id: 1 } })
    expect(guardada).toMatchObject({ estado: 'pendiente', autor: 'Kevin R.', ciudad: pais, productoSku: p.sku, productoNombre: p.nombre, moderadoPor: null })
    expect(await publicas(p.id)).toEqual([])
    expect(await fichaPublica(p.id)).toMatchObject({ calificacion: null, totalResenas: 0 })
  })

  it('400 si el navegador envía estado, verificación u otros campos, o un comentario corto', async () => {
    const p = await crearProducto()
    // El límite de tasa también cuenta los envíos inválidos: una app por envío.
    for (const extra of [{ estado: 'aprobada' }, { verificada: true }, { sitioWeb: '' }, { comentario: 'ok' }, { calificacion: 6 }, { autor: '   ' }]) {
      const res = await request(nuevaApp()).post(tienda(p.id)).send(opinion(extra))
      expect(res.status).toBe(400)
    }
    expect(await prisma.resena.count({ where: { productoId: p.id } })).toBe(0)
  })

  it('404 al enviar o leer reseñas de un producto oculto o inexistente', async () => {
    const oculto = await crearProducto(false)
    const app = nuevaApp()
    expect((await request(app).post(tienda(oculto.id)).send(opinion())).status).toBe(404)
    expect((await request(app).get(tienda(oculto.id))).status).toBe(404)
    expect((await request(app).post(tienda(999999)).send(opinion())).status).toBe(404)
    expect(await prisma.resena.count({ where: { productoId: oculto.id } })).toBe(0)
  })

  it('antispam: la misma opinión dentro de 24 h responde igual pero no se guarda otra vez', async () => {
    const p = await crearProducto()
    const app = nuevaApp()
    const cuerpo = opinion()
    expect((await request(app).post(tienda(p.id)).send(cuerpo)).status).toBe(201)
    const repetida = await request(app).post(tienda(p.id)).send(cuerpo)
    expect(repetida.status).toBe(201)
    expect(repetida.body.data).toEqual({ estado: 'pendiente' })
    expect(await prisma.resena.count({ where: { productoId: p.id } })).toBe(1)
    // Otra opinión del mismo autor sí entra.
    expect((await request(app).post(tienda(p.id)).send(opinion())).status).toBe(201)
    expect(await prisma.resena.count({ where: { productoId: p.id } })).toBe(2)
  })

  it('antispam: el sexto envío de una IP en 10 minutos → 429 y no se guarda', async () => {
    const p = await crearProducto()
    const app = nuevaApp()
    for (let i = 0; i < 5; i++) expect((await request(app).post(tienda(p.id)).send(opinion())).status).toBe(201)
    const sexto = await request(app).post(tienda(p.id)).send(opinion())
    expect(sexto.status).toBe(429)
    expect(sexto.body.error.code).toBe('TOO_MANY_REQUESTS')
    expect(await prisma.resena.count({ where: { productoId: p.id } })).toBe(5)
    // Leer no está limitado.
    expect((await request(app).get(tienda(p.id))).status).toBe(200)
  })
})

describe('L17 · moderación y publicación', () => {
  it('solo se ven las aprobadas; la calificación y el total del catálogo salen de ellas', async () => {
    const p = await crearProducto()
    const [cinco, cuatro, otraCuatro, pendiente] = [
      await sembrarResena(p, 5),
      await sembrarResena(p, 4),
      await sembrarResena(p, 4),
      await sembrarResena(p, 1),
    ]

    for (const r of [cinco, cuatro, otraCuatro]) {
      const res = await moderar(r.id, { estado: 'aprobada' })
      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({ estado: 'aprobada', moderadoPor: 'Prueba', motivoRechazo: '', producto: { id: p.id, sku: p.sku } })
    }

    const visibles = await publicas(p.id)
    expect(visibles.map((r) => r.id).sort()).toEqual([cinco.id, cuatro.id, otraCuatro.id].sort())
    expect(visibles.map((r) => r.id)).not.toContain(pendiente.id)
    expect(Object.keys(visibles[0]!).sort()).toEqual(['autor', 'calificacion', 'ciudad', 'comentario', 'creadoEn', 'id'])
    // (5 + 4 + 4) / 3 = 4.33 → 4.3, en la ficha, el listado y el admin.
    expect(await fichaPublica(p.id)).toMatchObject({ calificacion: 4.3, totalResenas: 3 })
    const listado = (await request(admin).get('/api/v1/tienda/productos?limit=100')).body.data as { id: number; calificacion: number | null }[]
    expect(listado.find((x) => x.id === p.id)?.calificacion).toBe(4.3)
    expect((await request(admin).get(`/api/v1/admin/productos/${p.id}`).set(auth)).body.data).toMatchObject({ calificacion: 4.3, totalResenas: 3 })

    // Ocultar una publicada la retira de la tienda y de la calificación.
    const oculta = await moderar(cinco.id, { estado: 'rechazada', motivo: 'Spam o publicidad' })
    expect(oculta.body.data).toMatchObject({ estado: 'rechazada', motivoRechazo: 'Spam o publicidad' })
    expect((await publicas(p.id)).map((r) => r.id)).not.toContain(cinco.id)
    expect(await fichaPublica(p.id)).toMatchObject({ calificacion: 4, totalResenas: 2 })

    // «Publicar de todos modos» desde rechazada limpia el motivo.
    expect((await moderar(cinco.id, { estado: 'aprobada' })).body.data).toMatchObject({ estado: 'aprobada', motivoRechazo: '' })
  })

  it('422 al repetir el estado actual; 400 sin motivo de rechazo o al volver a pendiente; 404 si no existe', async () => {
    const p = await crearProducto()
    const r = await sembrarResena(p, 3)

    expect((await moderar(r.id, { estado: 'rechazada' })).status).toBe(400)
    expect((await moderar(r.id, { estado: 'rechazada', motivo: 'no' })).status).toBe(400)
    expect((await moderar(r.id, { estado: 'pendiente' })).status).toBe(400)
    expect((await moderar(r.id, { estado: 'aprobada', motivo: 'x' })).status).toBe(400)
    expect((await moderar(r.id, { estado: 'rechazada', motivo: 'Lenguaje ofensivo' })).status).toBe(200)
    const repetida = await moderar(r.id, { estado: 'rechazada', motivo: 'Otro motivo' })
    expect(repetida.status).toBe(422)
    expect(repetida.body.error.message).toBe('La reseña ya está rechazada.')
    expect((await prisma.resena.findUniqueOrThrow({ where: { id: r.id } })).motivoRechazo).toBe('Lenguaje ofensivo')
    expect((await moderar(999999, { estado: 'aprobada' })).status).toBe(404)
  })

  it('aprobación en lote: todas deben existir y las ya aprobadas se dejan como están', async () => {
    const p = await crearProducto()
    const [a, b, c] = [await sembrarResena(p, 5), await sembrarResena(p, 4, 'rechazada'), await sembrarResena(p, 3, 'aprobada')]

    const faltante = await request(admin).post(`${RESENAS}/aprobacion`).set(auth).send({ ids: [a.id, 999999] })
    expect(faltante.status).toBe(404)
    expect((await prisma.resena.findUniqueOrThrow({ where: { id: a.id } })).estado).toBe('pendiente')
    expect((await request(admin).post(`${RESENAS}/aprobacion`).set(auth).send({ ids: [a.id, a.id] })).status).toBe(400)

    const res = await request(admin).post(`${RESENAS}/aprobacion`).set(auth).send({ ids: [a.id, b.id, c.id] })
    expect(res.status).toBe(200)
    expect((res.body.data as { estado: string }[]).map((r) => r.estado)).toEqual(['aprobada', 'aprobada', 'aprobada'])
    // La que ya estaba aprobada conserva su moderación (nadie la había moderado en la prueba).
    expect((await prisma.resena.findUniqueOrThrow({ where: { id: c.id } })).moderadoPor).toBeNull()
    expect(await fichaPublica(p.id)).toMatchObject({ totalResenas: 3, calificacion: 4 })
  })

  it('bandeja: filtra por estado y pagina, de la más reciente a la más antigua', async () => {
    const p = await crearProducto()
    const antigua = await sembrarResena(p, 2)
    const reciente = await sembrarResena(p, 5)

    const res = await request(admin).get(`${RESENAS}?estado=pendiente&limit=100`).set(auth)
    expect(res.status).toBe(200)
    const ids = (res.body.data as { id: number; estado: string }[]).map((r) => r.id)
    expect(ids.indexOf(reciente.id)).toBeLessThan(ids.indexOf(antigua.id))
    expect((res.body.data as { estado: string }[]).every((r) => r.estado === 'pendiente')).toBe(true)
    const pagina = await request(admin).get(`${RESENAS}?limit=1`).set(auth)
    expect(pagina.body.meta).toMatchObject({ page: 1, limit: 1 })
    expect(pagina.body.data).toHaveLength(1)
    expect((await request(admin).get(`${RESENAS}?estado=otra`).set(auth)).status).toBe(400)
  })

  it('eliminar es definitivo (204, luego 404) y deja de contar en la tienda', async () => {
    const p = await crearProducto()
    const r = await sembrarResena(p, 5, 'aprobada')
    expect(await fichaPublica(p.id)).toMatchObject({ totalResenas: 1, calificacion: 5 })

    expect((await request(admin).delete(`${RESENAS}/${r.id}`).set(auth)).status).toBe(204)
    expect((await request(admin).delete(`${RESENAS}/${r.id}`).set(auth)).status).toBe(404)
    expect(await fichaPublica(p.id)).toMatchObject({ totalResenas: 0, calificacion: null })
  })

  it('si el producto se elimina, la reseña conserva el SKU y el nombre', async () => {
    const p = await crearProducto()
    const r = await sembrarResena(p, 4)
    await prisma.producto.delete({ where: { id: p.id } })

    const res = await request(admin).get(`${RESENAS}?estado=pendiente&limit=100`).set(auth)
    const fila = (res.body.data as { id: number }[]).find((x) => x.id === r.id)
    expect(fila).toMatchObject({ producto: { id: null, sku: p.sku, nombre: p.nombre } })
  })
})
