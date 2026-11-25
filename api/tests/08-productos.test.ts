import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

const UID = 'prueba-l05'
const NOMBRE = 'Prueba L05'
const MARCA_INACTIVA = 'prueba-l05-inactiva'
const falsas = crearImagenesFalsas()
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: falsas.proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)])

let marcaActiva = ''

const base = (extra: Record<string, unknown> = {}) => ({
  nombre: `${NOMBRE} Laptop`,
  categoria: 'computadoras',
  marca: marcaActiva,
  precio: '499.90',
  ...extra,
})

const subir = (contenido: Buffer, tipo = 'image/png') =>
  request(app).post('/api/v1/admin/imagenes').set(auth).set('Content-Type', tipo).send(contenido)

async function limpiar() {
  const ids = (await prisma.producto.findMany({ where: { nombre: { startsWith: NOMBRE } }, select: { id: true } })).map((p) => p.id)
  await prisma.movimientoInventario.deleteMany({ where: { productoId: { in: ids } } })
  await prisma.producto.deleteMany({ where: { id: { in: ids } } })
  await prisma.marca.deleteMany({ where: { slug: MARCA_INACTIVA } })
  await prisma.imagenPendiente.deleteMany({ where: { publicId: { startsWith: 'compustore/productos/prueba-' } } })
}

beforeAll(async () => {
  await sembrar(prisma)
  await limpiar()
  const usuario = await crearUsuarioHabilitado(UID)
  expect(usuario.id).toBeGreaterThan(0)
  marcaActiva = (await prisma.marca.findFirstOrThrow({ where: { activa: true } })).slug
  await prisma.marca.create({ data: { slug: MARCA_INACTIVA, nombre: 'Prueba L05 Inactiva', descripcion: '', activa: false } })
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

beforeEach(() => {
  falsas.estado.configurado = true
  falsas.estado.fallarEliminar = false
})

describe('Productos: protección y lectura', () => {
  it('las rutas admin exigen sesión (401)', async () => {
    expect((await request(app).get('/api/v1/admin/productos')).status).toBe(401)
    expect((await request(app).post('/api/v1/admin/imagenes').set('Content-Type', 'image/png').send(PNG)).status).toBe(401)
  })

  it('lista con meta y la forma admin (§4.2)', async () => {
    const res = await request(app).get('/api/v1/admin/productos?limit=5').set(auth)

    expect(res.status).toBe(200)
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5 })
    const producto = res.body.data[0]
    expect(producto).toMatchObject({
      id: expect.any(Number),
      sku: expect.any(String),
      categoria: { slug: expect.any(String), nombre: expect.any(String) },
      marca: { slug: expect.any(String), nombre: expect.any(String) },
      precio: expect.stringMatching(/^\d+\.\d{2}$/),
      tasaIva: expect.stringMatching(/^\d+\.\d{2}$/),
      calificacion: null,
      totalResenas: 0,
      controlLotes: expect.any(Boolean),
      lotes: expect.any(Array),
      publicado: expect.any(Boolean),
    })
    expect(producto.disponible).toBe(producto.stock)
  })

  it('responde 404 si el producto no existe y 400 si el id no es válido', async () => {
    expect((await request(app).get('/api/v1/admin/productos/999999').set(auth)).status).toBe(404)
    expect((await request(app).get('/api/v1/admin/productos/abc').set(auth)).status).toBe(400)
  })
})

describe('Productos: alta', () => {
  it('crea con SKU automático PRD-###, slug y stock inicial registrado como movimiento del usuario', async () => {
    const res = await request(app)
      .post('/api/v1/admin/productos')
      .set(auth)
      .send(base({ stock: 4, especificaciones: [{ clave: 'RAM', valor: '16 GB' }], precioAnterior: '599.90' }))

    expect(res.status).toBe(201)
    const p = res.body.data
    expect(p.sku).toBe(`PRD-${String(p.id).padStart(3, '0')}`)
    expect(p).toMatchObject({ slug: 'prueba-l05-laptop', stock: 4, precio: '499.90', precioAnterior: '599.90', tasaIva: '13.00', publicado: true })
    expect(p.especificaciones).toEqual([{ clave: 'RAM', valor: '16 GB' }])

    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { firebaseUid: UID } })
    const movimientos = await prisma.movimientoInventario.findMany({ where: { productoId: p.id } })
    expect(movimientos).toMatchObject([{ delta: 4, motivo: 'Alta de producto', usuarioId: usuario.id }])
  })

  it('agrega sufijo al slug repetido y no registra movimiento con stock 0', async () => {
    const res = await request(app).post('/api/v1/admin/productos').set(auth).send(base({ sku: 'prb-l05-002' }))

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ slug: 'prueba-l05-laptop-2', sku: 'PRB-L05-002', stock: 0 })
    expect(await prisma.movimientoInventario.count({ where: { productoId: res.body.data.id } })).toBe(0)
  })

  it('rechaza un SKU repetido sin distinguir mayúsculas (409)', async () => {
    const res = await request(app).post('/api/v1/admin/productos').set(auth).send(base({ sku: 'PRB-l05-002' }))

    expect(res.status).toBe(409)
    expect(res.body.error.message).toBe('Este SKU ya está asignado a otro producto.')
  })

  it('rechaza categoría inexistente y marca inactiva (422)', async () => {
    const sinCategoria = await request(app).post('/api/v1/admin/productos').set(auth).send(base({ categoria: 'no-existe' }))
    expect(sinCategoria.status).toBe(422)

    const inactiva = await request(app).post('/api/v1/admin/productos').set(auth).send(base({ marca: MARCA_INACTIVA }))
    expect(inactiva.status).toBe(422)
    expect(inactiva.body.error.message).toMatch(/inactiva/)
  })

  it('valida precios, SKU, imágenes y campos de L06 (400)', async () => {
    const casos = [
      base({ precio: '0' }),
      base({ precio: '12.345' }),
      base({ precioAnterior: '100.00' }),
      base({ tasaIva: '101' }),
      base({ sku: '-MAL' }),
      base({ imagenes: ['data:image/png;base64,AAAA'] }),
      base({ imagenes: ['https://x.test/a.png', 'https://x.test/a.png'] }),
      base({ especificaciones: [{ clave: '', valor: 'x' }] }),
      base({ controlLotes: true }),
      base({ stock: -1 }),
    ]
    for (const cuerpo of casos) {
      const res = await request(app).post('/api/v1/admin/productos').set(auth).send(cuerpo)
      expect(res.status, JSON.stringify(cuerpo)).toBe(400)
    }
  })
})

describe('Productos: edición, publicación y tienda', () => {
  let id = 0

  beforeAll(async () => {
    id = (await prisma.producto.findFirstOrThrow({ where: { sku: 'PRB-L05-002' } })).id
  })

  it('PATCH edita sin cambiar el slug y reemplaza las especificaciones', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/productos/${id}`)
      .set(auth)
      .send({ nombre: `${NOMBRE} Renombrado`, precio: '450.00', especificaciones: [{ clave: 'CPU', valor: 'i5' }] })

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ slug: 'prueba-l05-laptop-2', nombre: `${NOMBRE} Renombrado`, precio: '450.00' })
    expect(res.body.data.especificaciones).toEqual([{ clave: 'CPU', valor: 'i5' }])
  })

  it('PATCH valida el precio anterior contra el precio guardado y no acepta stock (400)', async () => {
    expect((await request(app).patch(`/api/v1/admin/productos/${id}`).set(auth).send({ precioAnterior: '400.00' })).status).toBe(400)
    expect((await request(app).patch(`/api/v1/admin/productos/${id}`).set(auth).send({ stock: 10 })).status).toBe(400)
  })

  it('un producto oculto desaparece de la tienda y vuelve al publicarlo', async () => {
    const off = await request(app).patch(`/api/v1/admin/productos/${id}/publicado`).set(auth).send({ publicado: false })
    expect(off.body.data.publicado).toBe(false)
    expect((await request(app).get(`/api/v1/tienda/productos/${id}`)).status).toBe(404)
    const lista = await request(app).get('/api/v1/tienda/productos')
    expect(lista.body.data.map((p: { id: number }) => p.id)).not.toContain(id)

    await request(app).patch(`/api/v1/admin/productos/${id}/publicado`).set(auth).send({ publicado: true })
    const publico = await request(app).get(`/api/v1/tienda/productos/${id}`)
    expect(publico.status).toBe(200)
    expect(publico.body.data).toMatchObject({ id, nombre: `${NOMBRE} Renombrado`, precio: '450.00', disponible: 0 })
    for (const interno of ['costo', 'stock', 'publicado', 'lotes', 'modelo']) expect(publico.body.data).not.toHaveProperty(interno)
  })
})

describe('Imágenes (D-17) y limpieza de huérfanas', () => {
  it('sube una imagen válida y queda pendiente', async () => {
    const res = await subir(WEBP, 'image/webp')

    expect(res.status).toBe(201)
    expect(res.body.data).toEqual({ id: expect.any(Number), url: expect.stringMatching(/^https:\/\//) })
    expect(await prisma.imagenPendiente.count({ where: { id: res.body.data.id } })).toBe(1)
  })

  it('rechaza tipo no admitido, firma falsa y archivos de más de 1.5 MB (400)', async () => {
    expect((await subir(PNG, 'image/gif')).status).toBe(400)
    expect((await subir(Buffer.from('no soy una imagen'), 'image/png')).status).toBe(400)

    const grande = await subir(Buffer.concat([PNG, Buffer.alloc(1.6 * 1024 * 1024)]))
    expect(grande.status).toBe(400)
    expect(grande.body.error.message).toBe('La imagen supera 1.5 MB. Usa una más liviana.')
  })

  it('responde 503 si el almacén no está configurado', async () => {
    falsas.estado.configurado = false
    expect((await subir(PNG)).status).toBe(503)
  })

  it('al guardar, el producto adopta la imagen pendiente; al quitarla, se destruye', async () => {
    const subida = (await subir(PNG)).body.data as { id: number; url: string }
    const creado = await request(app)
      .post('/api/v1/admin/productos')
      .set(auth)
      .send(base({ nombre: `${NOMBRE} Con imagen`, imagenes: [subida.url, 'https://externa.test/foto.png'] }))

    expect(creado.status).toBe(201)
    expect(creado.body.data.imagenes).toEqual([subida.url, 'https://externa.test/foto.png'])
    expect(await prisma.imagenPendiente.count({ where: { id: subida.id } })).toBe(0)
    const fila = await prisma.imagenProducto.findFirstOrThrow({ where: { productoId: creado.body.data.id, orden: 0 } })
    expect(fila.publicId).not.toBeNull()

    // Ya pertenece a un producto: el descarte no la toca.
    expect((await request(app).delete(`/api/v1/admin/imagenes/${subida.id}`).set(auth)).status).toBe(404)

    const editado = await request(app)
      .patch(`/api/v1/admin/productos/${creado.body.data.id}`)
      .set(auth)
      .send({ imagenes: ['https://externa.test/foto.png'] })
    expect(editado.body.data.imagenes).toEqual(['https://externa.test/foto.png'])
    expect(falsas.eliminadas).toContain(fila.publicId)
  })

  it('el admin descarta una pendiente tras un guardado fallido (204)', async () => {
    const subida = (await subir(PNG)).body.data as { id: number }
    const res = await request(app).delete(`/api/v1/admin/imagenes/${subida.id}`).set(auth)

    expect(res.status).toBe(204)
    expect(await prisma.imagenPendiente.count({ where: { id: subida.id } })).toBe(0)
  })

  it('cada subida barre las pendientes vencidas (más de 1 h)', async () => {
    const vieja = await prisma.imagenPendiente.create({
      data: { publicId: 'compustore/productos/prueba-vieja', url: 'https://res.cloudinary.test/vieja.png', creadaEn: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    })
    await subir(PNG)

    expect(await prisma.imagenPendiente.count({ where: { id: vieja.id } })).toBe(0)
    expect(falsas.eliminadas).toContain('compustore/productos/prueba-vieja')
  })

  it('si Cloudinary falla al destruir, la imagen se reencola para el barrido', async () => {
    const subida = (await subir(PNG)).body.data as { id: number; url: string }
    const creado = await request(app)
      .post('/api/v1/admin/productos')
      .set(auth)
      .send(base({ nombre: `${NOMBRE} Reencolar`, imagenes: [subida.url] }))

    falsas.estado.fallarEliminar = true
    const editado = await request(app).patch(`/api/v1/admin/productos/${creado.body.data.id}`).set(auth).send({ imagenes: [] })

    expect(editado.status).toBe(200)
    expect(await prisma.imagenPendiente.count({ where: { url: subida.url } })).toBe(1)
  })
})

describe('Productos: eliminación', () => {
  it('no elimina un producto con historial de inventario (409) y muestra la alternativa', async () => {
    const conHistorial = await prisma.producto.findFirstOrThrow({ where: { movimientos: { some: {} } } })
    const res = await request(app).delete(`/api/v1/admin/productos/${conHistorial.id}`).set(auth)

    expect(res.status).toBe(409)
    expect(res.body.error.message).toBe('Tiene historial de inventario: ocúltalo de la tienda y, si corresponde, ajusta su stock a 0.')
  })

  it('elimina un producto sin movimientos (204) y destruye sus imágenes', async () => {
    const subida = (await subir(PNG)).body.data as { url: string }
    const creado = (await request(app).post('/api/v1/admin/productos').set(auth).send(base({ nombre: `${NOMBRE} Borrable`, imagenes: [subida.url] }))).body
      .data as { id: number }
    const { publicId } = await prisma.imagenProducto.findFirstOrThrow({ where: { productoId: creado.id } })

    expect((await request(app).delete(`/api/v1/admin/productos/${creado.id}`).set(auth)).status).toBe(204)
    expect(await prisma.producto.count({ where: { id: creado.id } })).toBe(0)
    expect(falsas.eliminadas).toContain(publicId)
  })
})
