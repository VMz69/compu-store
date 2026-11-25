import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

const UID = 'prueba-l06'
const NOMBRE = 'Prueba L06'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }

let usuarioId = 0
let categoriaId = 0
let marcaId = 0
let secuencia = 0

/** Producto de prueba con stock manual (o lotes) y su movimiento inicial, como lo deja el alta. */
async function crearProducto(stock: number, lotes: { numero: string; cantidad: number; vence?: Date }[] = []) {
  secuencia += 1
  const controlLotes = lotes.length > 0
  const total = controlLotes ? lotes.reduce((suma, l) => suma + l.cantidad, 0) : stock
  const producto = await prisma.producto.create({
    data: {
      sku: `L06-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `prueba-l06-${Date.now()}-${secuencia}`,
      nombre: `${NOMBRE} ${secuencia}`,
      categoriaId,
      marcaId,
      modelo: '',
      precio: '10.00',
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
      stock: total,
      controlLotes,
      lotes: { create: lotes },
    },
    include: { lotes: true },
  })
  const iniciales = controlLotes
    ? producto.lotes.map((l) => ({ productoId: producto.id, loteId: l.id, delta: l.cantidad }))
    : total > 0
      ? [{ productoId: producto.id, loteId: null, delta: total }]
      : []
  await prisma.movimientoInventario.createMany({ data: iniciales.map((m) => ({ ...m, motivo: 'Prueba', usuarioId })) })
  return producto
}

/** Σ delta de los movimientos: debe ser igual al stock en todo momento. */
async function sumaMovimientos(productoId: number) {
  const { _sum } = await prisma.movimientoInventario.aggregate({ where: { productoId }, _sum: { delta: true } })
  return _sum.delta ?? 0
}

const stockDe = async (id: number) => (await prisma.producto.findUniqueOrThrow({ where: { id } })).stock

const ajustar = (id: number, delta: number) => request(app).post(`/api/v1/admin/productos/${id}/ajustes`).set(auth).send({ delta })

async function limpiar() {
  const ids = (await prisma.producto.findMany({ where: { nombre: { startsWith: NOMBRE } }, select: { id: true } })).map((p) => p.id)
  await prisma.movimientoInventario.deleteMany({ where: { productoId: { in: ids } } })
  await prisma.producto.deleteMany({ where: { id: { in: ids } } })
}

beforeAll(async () => {
  await sembrar(prisma)
  await limpiar()
  usuarioId = (await crearUsuarioHabilitado(UID)).id
  categoriaId = (await prisma.categoria.findFirstOrThrow()).id
  marcaId = (await prisma.marca.findFirstOrThrow({ where: { activa: true } })).id
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Inventario: protección', () => {
  it('las rutas exigen sesión (401)', async () => {
    expect((await request(app).post('/api/v1/admin/productos/1/ajustes').send({ delta: 1 })).status).toBe(401)
    expect((await request(app).put('/api/v1/admin/productos/1/existencias').send({})).status).toBe(401)
    expect((await request(app).get('/api/v1/admin/inventario/metricas')).status).toBe(401)
  })
})

describe('Inventario: métricas', () => {
  it('coinciden con un recálculo independiente sobre las filas de la BD', async () => {
    await crearProducto(0)
    await crearProducto(2)
    await crearProducto(50)

    const res = await request(app).get('/api/v1/admin/inventario/metricas').set(auth)

    const filas = await prisma.producto.findMany({ select: { stock: true, puntoReorden: true, publicado: true, precio: true } })
    const centavos = filas.reduce((suma, p) => suma + BigInt(p.precio.mul(100).toFixed(0)) * BigInt(p.stock), 0n)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({
      total: filas.length,
      publicados: filas.filter((p) => p.publicado).length,
      stockBajo: filas.filter((p) => p.stock > 0 && p.stock <= p.puntoReorden).length,
      agotados: filas.filter((p) => p.stock === 0).length,
      valoracion: `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`,
    })
  })
})

describe('Inventario: ajuste rápido', () => {
  it('suma y resta, y registra el movimiento con usuario y motivo automático', async () => {
    const producto = await crearProducto(5)

    const mas = await ajustar(producto.id, 2)
    expect(mas.status).toBe(200)
    expect(mas.body.data).toEqual({ productoId: producto.id, stock: 7, controlLotes: false, lotes: [] })

    const menos = await ajustar(producto.id, -3)
    expect(menos.body.data.stock).toBe(4)

    const movimientos = await prisma.movimientoInventario.findMany({ where: { productoId: producto.id }, orderBy: { id: 'asc' } })
    expect(movimientos.slice(1).map(({ delta, motivo, usuarioId: u, loteId }) => ({ delta, motivo, u, loteId }))).toEqual([
      { delta: 2, motivo: 'Ajuste rápido (+2)', u: usuarioId, loteId: null },
      { delta: -3, motivo: 'Ajuste rápido (−3)', u: usuarioId, loteId: null },
    ])
    expect(await sumaMovimientos(producto.id)).toBe(4)
  })

  it('no deja el stock negativo (422) y no registra nada', async () => {
    const producto = await crearProducto(1)

    const res = await ajustar(producto.id, -2)

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('BUSINESS_RULE')
    expect(await stockDe(producto.id)).toBe(1)
    expect(await sumaMovimientos(producto.id)).toBe(1)
  })

  it('rechaza el ajuste rápido en un producto con lotes (422)', async () => {
    const producto = await crearProducto(0, [{ numero: 'A', cantidad: 2 }])
    expect((await ajustar(producto.id, 1)).status).toBe(422)
  })

  it('valida el cuerpo (400) y el producto (404)', async () => {
    const producto = await crearProducto(1)
    expect((await ajustar(producto.id, 0)).status).toBe(400)
    expect((await ajustar(producto.id, 1.5)).status).toBe(400)
    expect((await request(app).post(`/api/v1/admin/productos/${producto.id}/ajustes`).set(auth).send({ delta: 1, motivo: 'x' })).status).toBe(400)
    expect((await ajustar(999_999, 1)).status).toBe(404)
  })
})

const editar = (id: number, cuerpo: Record<string, unknown>) =>
  request(app).put(`/api/v1/admin/productos/${id}/existencias`).set(auth).send(cuerpo)

const movimientosDe = async (productoId: number, desde = 0) =>
  (await prisma.movimientoInventario.findMany({ where: { productoId, id: { gt: desde } }, orderBy: { id: 'asc' } })).map(
    ({ delta, motivo, loteId }) => ({ delta, motivo, loteId }),
  )

const ultimoMovimiento = async () => (await prisma.movimientoInventario.findFirst({ orderBy: { id: 'desc' } }))?.id ?? 0

describe('Inventario: edición de existencias (ficha)', () => {
  it('stock manual: registra la diferencia', async () => {
    const producto = await crearProducto(4)
    const desde = await ultimoMovimiento()

    const res = await editar(producto.id, { controlLotes: false, stock: 10, stockEsperado: 4 })

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ stock: 10, controlLotes: false, lotes: [] })
    expect(await movimientosDe(producto.id, desde)).toEqual([{ delta: 6, motivo: 'Edición de existencias', loteId: null }])
    expect(await sumaMovimientos(producto.id)).toBe(10)
  })

  it('409 si el stock cambió desde que se abrió la ficha', async () => {
    const producto = await crearProducto(4)
    await ajustar(producto.id, -1)

    const res = await editar(producto.id, { controlLotes: false, stock: 10, stockEsperado: 4 })

    expect(res.status).toBe(409)
    expect(await stockDe(producto.id)).toBe(3)
  })

  it('activar lotes: sale el saldo manual y entran los lotes', async () => {
    const producto = await crearProducto(5)
    const desde = await ultimoMovimiento()

    const res = await editar(producto.id, {
      controlLotes: true,
      stockEsperado: 5,
      lotes: [
        { numero: 'L-1', cantidad: 4, vence: '2027-03-31' },
        { numero: 'L-2', cantidad: 2, vence: null },
      ],
    })

    expect(res.status).toBe(200)
    expect(res.body.data.stock).toBe(6)
    expect(res.body.data.controlLotes).toBe(true)
    expect(res.body.data.lotes).toEqual([
      { id: expect.any(Number), numero: 'L-1', cantidad: 4, vence: '2027-03-31' },
      { id: expect.any(Number), numero: 'L-2', cantidad: 2, vence: null },
    ])
    const [l1, l2] = res.body.data.lotes as { id: number }[]
    expect(await movimientosDe(producto.id, desde)).toEqual([
      { delta: -5, motivo: 'Paso a control por lotes', loteId: null },
      { delta: 4, motivo: 'Lote L-1: creado', loteId: l1?.id },
      { delta: 2, motivo: 'Lote L-2: creado', loteId: l2?.id },
    ])
    expect(await sumaMovimientos(producto.id)).toBe(6)
  })

  it('lotes: ajusta, retira y crea; stock = Σ lotes', async () => {
    const producto = await crearProducto(0, [
      { numero: 'A', cantidad: 3 },
      { numero: 'B', cantidad: 2 },
    ])
    const [a, b] = producto.lotes
    const desde = await ultimoMovimiento()

    const res = await editar(producto.id, {
      controlLotes: true,
      stockEsperado: 5,
      lotes: [
        { id: a?.id, numero: 'A', cantidad: 1, vence: '2026-12-31' },
        { numero: 'C', cantidad: 7, vence: null },
      ],
    })

    expect(res.status).toBe(200)
    expect(res.body.data.stock).toBe(8)
    expect(res.body.data.lotes.map((l: { numero: string }) => l.numero)).toEqual(['A', 'C'])
    expect(await prisma.lote.count({ where: { id: b?.id ?? 0 } })).toBe(0)
    const movimientos = await movimientosDe(producto.id, desde)
    expect(movimientos).toEqual([
      { delta: -2, motivo: 'Lote B: retirado', loteId: null }, // el lote se borró: su número queda en el motivo
      { delta: -2, motivo: 'Lote A: ajustado', loteId: a?.id },
      { delta: 7, motivo: 'Lote C: creado', loteId: expect.any(Number) },
    ])
    expect(await sumaMovimientos(producto.id)).toBe(8)
  })

  it('cambiar solo el vencimiento no genera movimiento', async () => {
    const producto = await crearProducto(0, [{ numero: 'V', cantidad: 2 }])
    const desde = await ultimoMovimiento()

    const res = await editar(producto.id, {
      controlLotes: true,
      stockEsperado: 2,
      lotes: [{ id: producto.lotes[0]?.id, numero: 'V', cantidad: 2, vence: '2027-01-15' }],
    })

    expect(res.body.data.lotes[0].vence).toBe('2027-01-15')
    expect(await movimientosDe(producto.id, desde)).toEqual([])
  })

  it('desactivar lotes: salen los lotes y entra el stock manual', async () => {
    const producto = await crearProducto(0, [
      { numero: 'X', cantidad: 3 },
      { numero: 'Y', cantidad: 1 },
    ])
    const desde = await ultimoMovimiento()

    const res = await editar(producto.id, { controlLotes: false, stock: 4, stockEsperado: 4 })

    expect(res.body.data).toMatchObject({ stock: 4, controlLotes: false, lotes: [] })
    expect(await movimientosDe(producto.id, desde)).toEqual([
      { delta: -3, motivo: 'Lote X: retirado', loteId: null },
      { delta: -1, motivo: 'Lote Y: retirado', loteId: null },
      { delta: 4, motivo: 'Paso a stock manual', loteId: null },
    ])
    expect(await sumaMovimientos(producto.id)).toBe(4)
  })

  it('valida lotes: repetidos, vacíos, fechas y lotes ajenos', async () => {
    const producto = await crearProducto(0, [{ numero: 'P', cantidad: 1 }])
    const otro = await crearProducto(0, [{ numero: 'Q', cantidad: 1 }])
    const lote = (extra: Record<string, unknown>) => ({ numero: 'N', cantidad: 1, vence: null, ...extra })

    expect((await editar(producto.id, { controlLotes: true, stockEsperado: 1, lotes: [] })).status).toBe(400)
    expect((await editar(producto.id, { controlLotes: true, stockEsperado: 1, lotes: [lote({}), lote({ numero: 'n' })] })).status).toBe(400)
    expect((await editar(producto.id, { controlLotes: true, stockEsperado: 1, lotes: [lote({ vence: '2027-02-30' })] })).status).toBe(400)
    expect((await editar(producto.id, { controlLotes: true, stockEsperado: 1, lotes: [lote({ cantidad: -1 })] })).status).toBe(400)
    expect((await editar(producto.id, { controlLotes: false, stockEsperado: 1 })).status).toBe(400)
    const ajeno = await editar(producto.id, { controlLotes: true, stockEsperado: 1, lotes: [lote({ id: otro.lotes[0]?.id })] })
    expect(ajeno.status).toBe(422)
    expect(await stockDe(producto.id)).toBe(1)
  })
})

describe('Inventario: alta de producto', () => {
  const alta = async (extra: Record<string, unknown>) => {
    const [categoria, marca] = await Promise.all([
      prisma.categoria.findUniqueOrThrow({ where: { id: categoriaId } }),
      prisma.marca.findUniqueOrThrow({ where: { id: marcaId } }),
    ])
    secuencia += 1
    return request(app)
      .post('/api/v1/admin/productos')
      .set(auth)
      .send({ nombre: `${NOMBRE} Alta ${secuencia}`, categoria: categoria.slug, marca: marca.slug, precio: '25.00', ...extra })
  }

  it('con stock manual: un movimiento "Alta de producto" del usuario', async () => {
    const res = await alta({ stock: 6 })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ stock: 6, controlLotes: false })
    expect(await movimientosDe(res.body.data.id)).toEqual([{ delta: 6, motivo: 'Alta de producto', loteId: null }])
  })

  it('con lotes: stock = Σ lotes y un movimiento por lote', async () => {
    const res = await alta({
      stock: 99, // se ignora con control de lotes
      controlLotes: true,
      lotes: [
        { numero: 'AL-1', cantidad: 3, vence: '2027-06-30' },
        { numero: 'AL-2', cantidad: 0, vence: null },
        { numero: 'AL-3', cantidad: 2, vence: null },
      ],
    })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ stock: 5, controlLotes: true })
    expect(res.body.data.lotes).toHaveLength(3)
    const movimientos = await movimientosDe(res.body.data.id)
    expect(movimientos.map(({ delta, motivo }) => ({ delta, motivo }))).toEqual([
      { delta: 3, motivo: 'Alta de producto (lote AL-1)' },
      { delta: 2, motivo: 'Alta de producto (lote AL-3)' },
    ])
    expect(await sumaMovimientos(res.body.data.id)).toBe(5)
  })

  it('valida la combinación de controlLotes y lotes (400)', async () => {
    expect((await alta({ controlLotes: true })).status).toBe(400)
    expect((await alta({ lotes: [{ numero: 'Z', cantidad: 1, vence: null }] })).status).toBe(400)
  })
})

describe('Inventario: concurrencia', () => {
  it('ajustes simultáneos sobre las últimas unidades nunca dejan stock negativo', async () => {
    const producto = await crearProducto(3)

    const respuestas = await Promise.all(Array.from({ length: 8 }, () => ajustar(producto.id, -1)))

    const estados = respuestas.map((r) => r.status).sort()
    expect(estados).toEqual([200, 200, 200, 422, 422, 422, 422, 422])
    expect(await stockDe(producto.id)).toBe(0)
    expect(await sumaMovimientos(producto.id)).toBe(0)
  })

  it('sumas y restas simultáneas cuadran con los movimientos', async () => {
    const producto = await crearProducto(2)

    const deltas = [-1, +3, -2, -1, +1, -2, -1, +2, -3, -1]
    const respuestas = await Promise.all(deltas.map((d) => ajustar(producto.id, d)))

    const aplicados = deltas.filter((_, i) => respuestas[i]?.status === 200).reduce((a, b) => a + b, 0)
    expect(respuestas.every((r) => r.status === 200 || r.status === 422)).toBe(true)
    const stock = await stockDe(producto.id)
    expect(stock).toBe(2 + aplicados)
    expect(stock).toBeGreaterThanOrEqual(0)
    expect(await sumaMovimientos(producto.id)).toBe(stock)
  })

  it('una edición de la ficha y ajustes simultáneos: la edición con stock viejo da 409, nunca negativo', async () => {
    const producto = await crearProducto(2)

    const [edicion, ...ajustes] = await Promise.all([
      editar(producto.id, { controlLotes: false, stock: 0, stockEsperado: 2 }),
      ajustar(producto.id, -1),
      ajustar(producto.id, -1),
    ])

    expect([200, 409]).toContain(edicion.status)
    expect(ajustes.every((r) => r.status === 200 || r.status === 422)).toBe(true)
    const stock = await stockDe(producto.id)
    expect(stock).toBeGreaterThanOrEqual(0)
    expect(await sumaMovimientos(producto.id)).toBe(stock)
  })
})

describe('Inventario: invariante', () => {
  it('al terminar la suite, en todo el catálogo Σ movimientos = stock', async () => {
    const [productos, sumas] = await Promise.all([
      prisma.producto.findMany({ select: { id: true, stock: true } }),
      prisma.movimientoInventario.groupBy({ by: ['productoId'], _sum: { delta: true } }),
    ])
    const porProducto = new Map(sumas.map((s) => [s.productoId, s._sum.delta ?? 0]))
    expect(productos.filter((p) => (porProducto.get(p.id) ?? 0) !== p.stock)).toEqual([])
  })
})
