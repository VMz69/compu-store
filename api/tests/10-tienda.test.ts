import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { limiteTasa } from '../src/04-pipeline-http/00-director-http.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

const UID = 'prueba-l07'
const PREFIJO = 'prueba-l07'
const app = crearApp({
  pingBD: async () => {},
  identidad: identidadFalsa,
  imagenes: crearImagenesFalsas().proveedor,
  origenes: [],
  extender: (a) => a.get('/prueba-limite', limiteTasa({ ventanaMs: 60_000, maximo: 2 }), (_req, res) => void res.json({ data: 'ok' })),
})
const auth = { Authorization: bearer(UID) }

interface ProductoPublico {
  id: number
  nombre: string
  precio: string
  precioAnterior: string | null
  etiqueta: string | null
  disponible: number
  categoria: { slug: string }
  marca: { slug: string }
}

let categoriaId = 0
let otraCategoriaId = 0
let marcaId = 0
let secuencia = 0

interface DatosPrueba {
  nombre: string
  precio?: string
  precioAnterior?: string | null
  stock?: number
  publicado?: boolean
  categoria?: number
  especificacion?: { clave: string; valor: string }
}

/** Producto de prueba (sin movimientos: se elimina sin restricciones). */
async function crearProducto({ nombre, precio = '10.00', precioAnterior = null, stock = 5, publicado = true, categoria, especificacion }: DatosPrueba) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L07-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre,
      categoriaId: categoria ?? categoriaId,
      marcaId,
      modelo: '',
      precio,
      precioAnterior,
      stock,
      publicado,
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
      ...(especificacion ? { especificaciones: { create: [{ ...especificacion, orden: 0 }] } } : {}),
    },
  })
}

async function limpiar() {
  const productos = await prisma.producto.findMany({ where: { slug: { startsWith: PREFIJO } }, select: { id: true } })
  const ids = productos.map((p) => p.id)
  await prisma.movimientoInventario.deleteMany({ where: { productoId: { in: ids } } })
  await prisma.producto.deleteMany({ where: { id: { in: ids } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

/** Todos los publicados en un orden dado (el catálogo de prueba cabe en una página de 100). */
async function listar(query: string): Promise<ProductoPublico[]> {
  const res = await request(app).get(`/api/v1/tienda/productos?limit=100&${query}`)
  expect(res.status).toBe(200)
  return res.body.data as ProductoPublico[]
}

const ids = (productos: { id: number }[]) => productos.map((p) => p.id)

let principal = { id: 0 }
let hermano = { id: 0 }
let tercero = { id: 0 }
let mismaMarca = { id: 0 }
let oculto = { id: 0 }
let agotado = { id: 0 }

beforeAll(async () => {
  await sembrar(prisma)
  await crearUsuarioHabilitado(UID)
  await limpiar()
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L07 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L07 Marca', descripcion: '' } })).id
  otraCategoriaId = (await prisma.categoria.findUniqueOrThrow({ where: { slug: 'audio' } })).id

  principal = await crearProducto({ nombre: 'Prueba L07 Ñandú Turbo', precio: '100.00', precioAnterior: '150.00', stock: 3 })
  hermano = await crearProducto({ nombre: 'Prueba L07 Hermano 100% real', precio: '20.00', stock: 2, especificacion: { clave: 'Chipset', valor: 'Quasarium X9' } })
  tercero = await crearProducto({ nombre: 'Prueba L07 Tercero', precio: '30.00' })
  mismaMarca = await crearProducto({ nombre: 'Prueba L07 Misma marca', precio: '40.00', categoria: otraCategoriaId })
  oculto = await crearProducto({ nombre: 'Prueba L07 Oculto Ñandú', precio: '50.00', publicado: false })
  agotado = await crearProducto({ nombre: 'Prueba L07 Agotado', precio: '60.00', stock: 0 })
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Tienda: listado público', () => {
  it('solo devuelve publicados, también al buscar', async () => {
    const todos = await listar('')
    const publicados = await prisma.producto.count({ where: { publicado: true } })
    expect(todos).toHaveLength(publicados)
    expect(ids(todos)).not.toContain(oculto.id)
    expect(ids(await listar('q=nandu'))).toEqual([principal.id])
  })

  it('busca sin distinguir mayúsculas ni acentos, por nombre, marca y especificación', async () => {
    expect(ids(await listar('q=ÑANDÚ turbo'))).toEqual([principal.id])
    expect(ids(await listar('q=quasarium'))).toEqual([hermano.id]) // valor de especificación
    expect(ids(await listar('q=chipset'))).toEqual([hermano.id]) // clave de especificación
    const porMarca = await listar(`q=${encodeURIComponent('prueba l07 marca')}`)
    expect(ids(porMarca).sort()).toEqual([principal.id, hermano.id, tercero.id, mismaMarca.id, agotado.id].sort())
  })

  it('trata % y _ como texto, no como comodines', async () => {
    expect(ids(await listar(`q=${encodeURIComponent('100%')}`))).toEqual([hermano.id])
    expect(await listar(`q=${encodeURIComponent('%')}`)).toEqual(await listar(`q=${encodeURIComponent('100%')}`))
    expect(await listar('q=_')).toEqual([])
  })

  it('filtra por categoría, marca y ofertas', async () => {
    expect(ids(await listar(`categoria=${PREFIJO}-cat`)).sort()).toEqual([principal.id, hermano.id, tercero.id, agotado.id].sort())
    const marca = await listar(`marca=${PREFIJO}-marca&categoria=audio`)
    expect(ids(marca)).toEqual([mismaMarca.id])
    expect(await listar('categoria=no-existe')).toEqual([])

    const ofertas = await listar('ofertas=true')
    expect(ofertas.length).toBeGreaterThan(0)
    expect(ofertas.every((p) => p.precioAnterior !== null && Number(p.precioAnterior) > Number(p.precio))).toBe(true)
    expect(ids(ofertas)).toContain(principal.id)
    expect(ids(ofertas)).not.toContain(hermano.id)
  })

  it('cada orden coincide con el recalculado en JS (desempate por id)', async () => {
    const base = await listar('orden=destacados')
    const porId = (a: ProductoPublico, b: ProductoPublico) => a.id - b.id
    const descuento = (p: ProductoPublico) => (p.precioAnterior && Number(p.precioAnterior) > Number(p.precio) ? Number(p.precioAnterior) - Number(p.precio) : 0)
    const colador = new Intl.Collator('es', { sensitivity: 'base' })
    const esperados: Record<string, (a: ProductoPublico, b: ProductoPublico) => number> = {
      destacados: (a, b) => Number(b.etiqueta === 'Destacado') - Number(a.etiqueta === 'Destacado') || porId(a, b),
      'precio-asc': (a, b) => Number(a.precio) - Number(b.precio) || porId(a, b),
      'precio-desc': (a, b) => Number(b.precio) - Number(a.precio) || porId(a, b),
      descuento: (a, b) => descuento(b) - descuento(a) || porId(a, b),
      'nombre-asc': (a, b) => colador.compare(a.nombre, b.nombre) || porId(a, b),
    }
    for (const [orden, comparar] of Object.entries(esperados)) {
      expect(ids(await listar(`orden=${orden}`)), orden).toEqual(ids([...base].sort(comparar)))
    }
  })

  it('pagina con meta coherente', async () => {
    const todos = await listar('orden=precio-asc')
    const res = await request(app).get('/api/v1/tienda/productos?orden=precio-asc&limit=5&page=2')
    expect(res.status).toBe(200)
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: todos.length, totalPages: Math.ceil(todos.length / 5) })
    expect(ids(res.body.data)).toEqual(ids(todos.slice(5, 10)))
  })

  it('rechaza parámetros inválidos (400)', async () => {
    expect((await request(app).get('/api/v1/tienda/productos?orden=barato')).status).toBe(400)
    expect((await request(app).get('/api/v1/tienda/productos?limit=101')).status).toBe(400)
    expect((await request(app).get('/api/v1/tienda/productos?ofertas=si')).status).toBe(400)
  })
})

describe('Tienda: relacionados', () => {
  it('misma categoría o marca, sin el propio producto ni ocultos, por id', async () => {
    const res = await request(app).get(`/api/v1/tienda/productos/${principal.id}/relacionados?limit=12`)
    expect(res.status).toBe(200)
    const relacionados = res.body.data as ProductoPublico[]
    expect(ids(relacionados)).not.toContain(principal.id)
    expect(ids(relacionados)).not.toContain(oculto.id)
    expect(ids(relacionados)).toEqual([...ids(relacionados)].sort((a, b) => a - b))
    expect(ids(relacionados)).toEqual(expect.arrayContaining([hermano.id, tercero.id, mismaMarca.id, agotado.id]))
    expect(relacionados.every((p) => p.categoria.slug === `${PREFIJO}-cat` || p.marca.slug === `${PREFIJO}-marca`)).toBe(true)
  })

  it('respeta el límite (4 por defecto)', async () => {
    const porDefecto = await request(app).get(`/api/v1/tienda/productos/${principal.id}/relacionados`)
    expect(porDefecto.body.data).toHaveLength(4)
    const dos = await request(app).get(`/api/v1/tienda/productos/${principal.id}/relacionados?limit=2`)
    expect(ids(dos.body.data)).toEqual([hermano.id, tercero.id])
  })

  it('404 si el producto no existe o está oculto', async () => {
    expect((await request(app).get(`/api/v1/tienda/productos/${oculto.id}/relacionados`)).status).toBe(404)
    expect((await request(app).get('/api/v1/tienda/productos/999999/relacionados')).status).toBe(404)
  })
})

describe('Tienda: identidad', () => {
  it('devuelve la identidad pública sin campos internos', async () => {
    const res = await request(app).get('/api/v1/tienda/identidad')
    expect(res.status).toBe(200)
    const identidad = res.body.data
    expect(identidad).not.toHaveProperty('id')
    expect(identidad).not.toHaveProperty('actualizadaEn')
    expect(identidad).toMatchObject({
      nombre: expect.any(String),
      whatsapp: expect.stringMatching(/^\d+$/),
      horario: expect.any(String),
      moneda: { codigo: 'USD', simbolo: '$', locale: expect.any(String) },
    })
    expect(Array.isArray(identidad.telefonos)).toBe(true)
    expect(Array.isArray(identidad.valores)).toBe(true)
    expect(typeof identidad.redes).toBe('object')
  })
})

describe('Tienda: validar carrito', () => {
  const validar = (lineas: unknown) => request(app).post('/api/v1/tienda/carrito/validar').send({ lineas })

  it('recalcula precios y existencias por línea', async () => {
    const res = await validar([
      { productoId: principal.id, cantidad: 2 }, // stock 3 → ok
      { productoId: hermano.id, cantidad: 5 }, // stock 2 → ajustada
      { productoId: agotado.id, cantidad: 1 },
      { productoId: oculto.id, cantidad: 1 },
      { productoId: 999999, cantidad: 1 },
    ])
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({
      lineas: [
        { productoId: principal.id, nombre: 'Prueba L07 Ñandú Turbo', precioUnitario: '100.00', cantidadSolicitada: 2, cantidadDisponible: 3, subtotal: '200.00', estado: 'ok' },
        { productoId: hermano.id, nombre: 'Prueba L07 Hermano 100% real', precioUnitario: '20.00', cantidadSolicitada: 5, cantidadDisponible: 2, subtotal: '40.00', estado: 'ajustada' },
        { productoId: agotado.id, nombre: 'Prueba L07 Agotado', precioUnitario: '60.00', cantidadSolicitada: 1, cantidadDisponible: 0, subtotal: '0.00', estado: 'agotado' },
        { productoId: oculto.id, nombre: 'Prueba L07 Oculto Ñandú', precioUnitario: null, cantidadSolicitada: 1, cantidadDisponible: 0, subtotal: '0.00', estado: 'no-disponible' },
        { productoId: 999999, nombre: null, precioUnitario: null, cantidadSolicitada: 1, cantidadDisponible: 0, subtotal: '0.00', estado: 'no-disponible' },
      ],
      total: '240.00',
      valido: false,
    })
  })

  it('es válido cuando todas las líneas están completas, y suma sin errores de coma flotante', async () => {
    const res = await validar([{ productoId: tercero.id, cantidad: 3 }])
    expect(res.body.data).toMatchObject({ total: '90.00', valido: true })
    const seed = await validar([{ productoId: 5, cantidad: 3 }]) // Logitech M185: 20.00 × 3
    expect(seed.body.data.lineas[0]).toMatchObject({ precioUnitario: '20.00', subtotal: '60.00' })
  })

  it('rechaza precios del navegador, repetidos, cantidades fuera de rango y más de 50 líneas (400)', async () => {
    expect((await validar([{ productoId: tercero.id, cantidad: 1, precio: '1.00' }])).status).toBe(400)
    expect((await request(app).post('/api/v1/tienda/carrito/validar').send({ lineas: [{ productoId: tercero.id, cantidad: 1 }], total: '1.00' })).status).toBe(400)
    expect((await validar([{ productoId: tercero.id, cantidad: 1 }, { productoId: tercero.id, cantidad: 2 }])).status).toBe(400)
    expect((await validar([{ productoId: tercero.id, cantidad: 0 }])).status).toBe(400)
    expect((await validar([{ productoId: tercero.id, cantidad: 100 }])).status).toBe(400)
    expect((await validar([])).status).toBe(400)
    expect((await validar(Array.from({ length: 51 }, (_, i) => ({ productoId: i + 1, cantidad: 1 })))).status).toBe(400)
  })

  it('refleja al instante un ajuste de stock hecho en el admin', async () => {
    const antes = await validar([{ productoId: tercero.id, cantidad: 5 }])
    expect(antes.body.data.lineas[0]).toMatchObject({ cantidadDisponible: 5, estado: 'ok' })

    const ajuste = await request(app).post(`/api/v1/admin/productos/${tercero.id}/ajustes`).set(auth).send({ delta: -3 })
    expect(ajuste.status).toBe(200)

    const despues = await validar([{ productoId: tercero.id, cantidad: 5 }])
    expect(despues.body.data.lineas[0]).toMatchObject({ cantidadDisponible: 2, subtotal: '60.00', estado: 'ajustada' })
    expect(despues.body.data.valido).toBe(false)
  })
})

describe('Límite de tasa', () => {
  it('responde 429 con el sobre de error al superar el máximo', async () => {
    expect((await request(app).get('/prueba-limite')).status).toBe(200)
    expect((await request(app).get('/prueba-limite')).status).toBe(200)
    const res = await request(app).get('/prueba-limite')
    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS')
  })
})
