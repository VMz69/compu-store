import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L15 · Facturación y stock (33–36, 12): emisión desde un pedido reservado con importes del servidor,
 * correlativos sin huecos ni duplicados (D-12), doble emisión imposible, descuento de stock y reserva en la
 * misma transacción (FEFO por lotes), anulación que repone exactamente y devuelve el pedido a Reservado, y
 * el circuito completo pedido → reserva → factura → entrega.
 * Datos con el prefijo «prueba-l15», canal «Prueba L15» y clientes con teléfonos 96….
 */
const UID = 'prueba-l15'
const PREFIJO = 'prueba-l15'
const CANAL = 'Prueba L15'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const PEDIDOS = '/api/v1/admin/pedidos'
const FACTURAS = '/api/v1/admin/facturas'

const hoy = hoyNegocio()
function enDias(dias: number): string {
  const fecha = new Date(`${hoy}T00:00:00.000Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

let categoriaId = 0
let marcaId = 0
let canalId = 0
let clienteId = 0
let secuencia = 0

interface LoteNuevo {
  numero: string
  cantidad: number
  vence: string | null
}

async function crearProducto(stock: number, lotes?: LoteNuevo[]) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L15-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre: `Prueba L15 producto ${secuencia}`,
      categoriaId,
      marcaId,
      modelo: '',
      precio: '10.00',
      stock: lotes ? lotes.reduce((s, l) => s + l.cantidad, 0) : stock,
      controlLotes: Boolean(lotes),
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
      ...(lotes && {
        lotes: { create: lotes.map((l) => ({ numero: l.numero, cantidad: l.cantidad, vence: l.vence ? new Date(`${l.vence}T00:00:00.000Z`) : null })) },
      }),
    },
  })
}

type Linea = { productoId: number; cantidad: number; descuento?: string }

async function pedidoReservado(lineas: Linea[], cargos: { concepto: string; monto: string }[] = []): Promise<number> {
  const res = await request(app)
    .post(PEDIDOS)
    .set(auth)
    .send({ clienteId, ciudad: 'Cojutepeque', canalId, formaPago: 'Efectivo', formaEntrega: 'Retiro en Sala de Ventas', lineas, cargos })
  expect(res.status).toBe(201)
  const id = res.body.data.id as number
  expect((await request(app).post(`${PEDIDOS}/${id}/reserva`).set(auth).send({ hasta: enDias(3) })).status).toBe(200)
  return id
}

const CONSUMIDOR_FINAL = { consumidorFinal: true, correo: '' }
const emitir = (pedidoId: number, extra: Record<string, unknown> = {}) =>
  request(app).post(FACTURAS).set(auth).send({ pedidoId, receptor: CONSUMIDOR_FINAL, condicionPago: 'efectivo', ...extra })
const anular = (id: number) => request(app).post(`${FACTURAS}/${id}/anulacion`).set(auth)

const producto = (id: number) => prisma.producto.findUniqueOrThrow({ where: { id }, include: { lotes: { orderBy: { id: 'asc' } } } })
const pedidoBD = (id: number) => prisma.pedido.findUniqueOrThrow({ where: { id }, include: { historial: { orderBy: { id: 'asc' } } } })
const ultimo = async (clave: string) => (await prisma.correlativo.findUniqueOrThrow({ where: { clave } })).ultimo
const sumaMovimientos = async (productoId: number) =>
  (await prisma.movimientoInventario.aggregate({ where: { productoId }, _sum: { delta: true } }))._sum.delta ?? 0

async function limpiar() {
  await prisma.factura.deleteMany({ where: { pedido: { canal: { nombre: { startsWith: CANAL } } } } })
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
  await prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '96' } } })
  await prisma.movimientoInventario.deleteMany({ where: { producto: { slug: { startsWith: PREFIJO } } } })
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L15 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L15 Marca', descripcion: '' } })).id
  canalId = (await prisma.canalVenta.create({ data: { nombre: `${CANAL} Mostrador`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '' } })).id
  clienteId = (
    await prisma.cliente.create({
      data: { tipo: 'persona', nombre: 'Prueba L15 cliente', telefono: '9615-0001', telefonoNormalizado: '96150001', correo: '', ciudad: '', direccion: '', notas: '' },
    })
  ).id
  // La semilla de otras suites no debe adelantar estos correlativos.
  await prisma.configuracionTienda.update({ where: { id: 1 }, data: { semillaFactura: null } })
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Emitir', () => {
  it('copia el pedido con importes del servidor, toma los correlativos y descuenta stock y reserva', async () => {
    const p = await crearProducto(5)
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 3, descuento: '10' }], [{ concepto: 'Envío local', monto: '5.50' }])
    const [control, interno] = [await ultimo('factura-control'), await ultimo('factura-interno')]

    const res = await emitir(pedidoId, {
      receptor: { consumidorFinal: false, nombre: 'Empresa Prueba', documento: '0614-250318-102-3', direccion: '', correo: 'Compras@Prueba.com' },
      condicionPago: 'transferencia',
      notas: 'Garantía 6 meses',
    })
    expect(res.status).toBe(201)
    const f = res.body.data
    expect(f).toMatchObject({
      numeroControl: `DTE-01-M001P001-${String(control + 1).padStart(15, '0')}`,
      correlativo: interno + 1,
      estado: 'emitida',
      condicionPago: 'transferencia',
      notas: 'Garantía 6 meses',
      total: '32.50',
      creadaPor: expect.any(String),
      anuladaEn: null,
      pedido: { id: pedidoId, visible: expect.stringMatching(/^ORD-\d{4}-\d{3,}$/) },
      receptor: { consumidorFinal: false, nombre: 'Empresa Prueba', documento: '0614-250318-102-3', direccion: 'Cojutepeque', correo: 'compras@prueba.com', telefono: '9615-0001' },
    })
    expect(f.codigoGeneracion).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/)
    expect(f.selloRecepcion).toMatch(new RegExp(`^${hoy.slice(0, 4)}[0-9A-F]{36}$`))
    expect(f.lineas).toEqual([
      expect.objectContaining({ tipo: 'producto', productoId: p.id, sku: p.sku, cantidad: 3, unidad: 'Unidad', precioUnitario: '10.00', descuento: '3.00', importe: '27.00' }),
      expect.objectContaining({ tipo: 'cargo', productoId: null, descripcion: 'Envío local', unidad: 'Servicio', cantidad: 1, precioUnitario: '5.50', descuento: '0.00', importe: '5.50' }),
    ])
    const config = await prisma.configuracionTienda.findUniqueOrThrow({ where: { id: 1 } })
    expect(f.emisor).toMatchObject({ nombreComercial: config.nombre, razonSocial: config.razonSocial, nit: config.nit, nrc: config.nrc })

    // Stock y reserva bajan juntos: el disponible no cambia. Movimiento con el motivo de la venta.
    expect(await producto(p.id)).toMatchObject({ stock: 2, reservado: 0 })
    expect(await sumaMovimientos(p.id)).toBe(-3)
    const mov = await prisma.movimientoInventario.findFirstOrThrow({ where: { productoId: p.id } })
    expect(mov.motivo).toBe(`Venta · Factura ${String(interno + 1).padStart(6, '0')} (${f.pedido.visible})`)

    // El pedido queda Facturado, sin reserva y con la factura activa en su DTO.
    const pedido = (await request(app).get(`${PEDIDOS}/${pedidoId}`).set(auth)).body.data
    expect(pedido).toMatchObject({ estado: 'facturado', reservadoHasta: null, factura: { id: f.id, numeroControl: f.numeroControl, correlativo: f.correlativo } })
    expect(pedido.historial.at(-1)).toMatchObject({ estado: 'facturado', nota: `Factura ${String(f.correlativo).padStart(6, '0')}` })

    // Lectura: detalle y listado.
    expect((await request(app).get(`${FACTURAS}/${f.id}`).set(auth)).body.data).toEqual(f)
    const lista = await request(app).get(`${FACTURAS}?estado=emitida&limit=5`).set(auth)
    expect(lista.status).toBe(200)
    expect(lista.body.data[0].id).toBe(f.id)
    expect(lista.body.meta).toMatchObject({ page: 1, limit: 5 })
  })

  it('consumidor final: nombre, documento y dirección fijos; el teléfono sale del pedido', async () => {
    const p = await crearProducto(2)
    const res = await emitir(await pedidoReservado([{ productoId: p.id, cantidad: 1 }]), {
      receptor: { consumidorFinal: true, nombre: 'Ignorado', documento: '123', direccion: 'X', correo: '' },
    })
    expect(res.status).toBe(201)
    expect(res.body.data.receptor).toEqual({ consumidorFinal: true, nombre: 'Consumidor Final', documento: '', direccion: 'Ciudad', correo: '', telefono: '9615-0001' })
  })

  it.each([
    ['un total del navegador', { total: '1.00' }],
    ['líneas del navegador', { lineas: [] }],
    ['un receptor identificado sin nombre', { receptor: { consumidorFinal: false, nombre: 'ab' } }],
    ['una condición de pago inválida', { condicionPago: 'bitcoin' }],
  ])('rechaza %s (400)', async (_caso, extra) => {
    const p = await crearProducto(1)
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 1 }])
    const antes = await ultimo('factura-interno')
    expect((await emitir(pedidoId, extra)).status).toBe(400)
    expect(await ultimo('factura-interno')).toBe(antes)
  })

  it('solo factura pedidos Reservados con la reserva vigente (422, sin consumir correlativos)', async () => {
    const p = await crearProducto(3)
    const registrado = (
      await request(app)
        .post(PEDIDOS)
        .set(auth)
        .send({ clienteId, ciudad: 'X', canalId, formaPago: 'Efectivo', formaEntrega: 'Retiro', lineas: [{ productoId: p.id, cantidad: 1 }] })
    ).body.data.id as number
    const vencido = await pedidoReservado([{ productoId: p.id, cantidad: 1 }])
    await prisma.pedido.update({ where: { id: vencido }, data: { reservadoHasta: new Date(`${enDias(-1)}T00:00:00.000Z`) } })
    const antes = await ultimo('factura-interno')

    const r1 = await emitir(registrado)
    expect(r1.status).toBe(422)
    expect(r1.body.error.message).toContain('no se puede facturar')
    const r2 = await emitir(vencido)
    expect(r2.status).toBe(422)
    expect(r2.body.error.message).toBe('La reserva del pedido venció: vuelve a reservarlo antes de facturar.')
    expect((await emitir(999999)).status).toBe(404)
    expect(await ultimo('factura-interno')).toBe(antes)
    expect(await producto(p.id)).toMatchObject({ stock: 3 })
  })

  it('la semilla adelanta el correlativo interno (máx(último + 1, semilla))', async () => {
    const p = await crearProducto(1)
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 1 }])
    const semilla = (await ultimo('factura-interno')) + 10
    await prisma.configuracionTienda.update({ where: { id: 1 }, data: { semillaFactura: semilla } })
    try {
      const res = await emitir(pedidoId)
      expect(res.status).toBe(201)
      expect(res.body.data.correlativo).toBe(semilla)
    } finally {
      await prisma.configuracionTienda.update({ where: { id: 1 }, data: { semillaFactura: null } })
    }
  })
})

describe('Doble emisión y correlativos', () => {
  it('la segunda emisión del mismo pedido falla (secuencial)', async () => {
    const p = await crearProducto(2)
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 1 }])
    expect((await emitir(pedidoId)).status).toBe(201)
    const otra = await emitir(pedidoId)
    expect(otra.status).toBe(422)
    expect(otra.body.error.message).toBe('Este pedido ya fue facturado.')
    expect(await prisma.factura.count({ where: { pedidoId } })).toBe(1)
  })

  it('dos emisiones simultáneas del mismo pedido: 201 + 422 y una sola salida de stock', async () => {
    const p = await crearProducto(2)
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 2 }])
    const antes = await ultimo('factura-interno')
    const estados = (await Promise.all([emitir(pedidoId), emitir(pedidoId)])).map((r) => r.status).sort()
    expect(estados).toEqual([201, 422])
    expect(await prisma.factura.count({ where: { pedidoId } })).toBe(1)
    expect(await ultimo('factura-interno')).toBe(antes + 1)
    expect(await producto(p.id)).toMatchObject({ stock: 0, reservado: 0 })
  })

  it('la BD impide dos facturas activas por pedido (índice único pedidoActivoId)', async () => {
    const [f] = await prisma.factura.findMany({ where: { estado: 'emitida', pedido: { canal: { nombre: { startsWith: CANAL } } } }, take: 1 })
    const { id: _id, numeroControl: _n, correlativo: _c, codigoGeneracion: _g, emisor, ...resto } = f!
    await expect(
      prisma.factura.create({
        data: { ...resto, emisor: emisor as object, numeroControl: 'DTE-01-PRUEBA-DUP', correlativo: 999_998, codigoGeneracion: 'PRUEBA-DUPLICADA-0000000000000000000' },
      }),
    ).rejects.toThrow()
  })

  it('emisiones simultáneas de pedidos distintos: correlativos consecutivos, sin huecos ni duplicados', async () => {
    const p = await crearProducto(5)
    const pedidos = []
    for (let i = 0; i < 5; i++) pedidos.push(await pedidoReservado([{ productoId: p.id, cantidad: 1 }]))
    const [control, interno] = [await ultimo('factura-control'), await ultimo('factura-interno')]

    const res = await Promise.all(pedidos.map((id) => emitir(id)))
    expect(res.map((r) => r.status)).toEqual([201, 201, 201, 201, 201])
    const internos = res.map((r) => r.body.data.correlativo as number).sort((a, b) => a - b)
    const controles = res.map((r) => r.body.data.numeroControl as string).sort()
    expect(internos).toEqual([1, 2, 3, 4, 5].map((n) => interno + n))
    expect(controles).toEqual([1, 2, 3, 4, 5].map((n) => `DTE-01-M001P001-${String(control + n).padStart(15, '0')}`))
    expect(await producto(p.id)).toMatchObject({ stock: 0, reservado: 0 })
  })
})

describe('Lotes (FEFO)', () => {
  it('descuenta por vencimiento más próximo (los que no vencen al final) y la anulación repone a los mismos lotes', async () => {
    const p = await crearProducto(0, [
      { numero: 'SIN-FECHA', cantidad: 5, vence: null },
      { numero: 'TARDE', cantidad: 2, vence: enDias(90) },
      { numero: 'PRONTO', cantidad: 2, vence: enDias(10) },
    ])
    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 5 }])
    const f = (await emitir(pedidoId)).body.data
    const tras = await producto(p.id)
    expect(tras.lotes.map((l) => [l.numero, l.cantidad])).toEqual([['SIN-FECHA', 4], ['TARDE', 0], ['PRONTO', 0]])
    expect(tras).toMatchObject({ stock: 4, reservado: 0 })
    const linea = await prisma.lineaFactura.findFirstOrThrow({ where: { facturaId: f.id, tipo: 'producto' } })
    expect((linea.lotes as { numero: string; cantidad: number }[]).map((l) => [l.numero, l.cantidad])).toEqual([['PRONTO', 2], ['TARDE', 2], ['SIN-FECHA', 1]])

    // Se retira el lote TARDE antes de anular: la anulación lo recrea con su número y vencimiento.
    const tarde = tras.lotes.find((l) => l.numero === 'TARDE')!
    await prisma.lote.delete({ where: { id: tarde.id } })

    expect((await anular(f.id)).status).toBe(200)
    const repuesto = await producto(p.id)
    expect(repuesto.lotes.map((l) => [l.numero, l.cantidad, l.vence?.toISOString().slice(0, 10) ?? null])).toEqual([
      ['SIN-FECHA', 5, null],
      ['PRONTO', 2, enDias(10)],
      ['TARDE', 2, enDias(90)],
    ])
    expect(repuesto).toMatchObject({ stock: 9, reservado: 5 })
    expect(repuesto.lotes.reduce((s, l) => s + l.cantidad, 0)).toBe(repuesto.stock)
  })
})

describe('Anular', () => {
  it('repone exactamente, conserva el número, devuelve el pedido a Reservado por 3 días y permite refacturar con otro número', async () => {
    const a = await crearProducto(4)
    const b = await crearProducto(1)
    const pedidoId = await pedidoReservado([
      { productoId: a.id, cantidad: 3 },
      { productoId: b.id, cantidad: 1 },
    ], [{ concepto: 'Instalación', monto: '15.00' }])
    const f = (await emitir(pedidoId)).body.data
    const movAntes = await sumaMovimientos(a.id)

    const res = await anular(f.id)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: f.id, estado: 'anulada', numeroControl: f.numeroControl, correlativo: f.correlativo, anuladaPor: expect.any(String) })
    expect(res.body.data.anuladaEn).not.toBeNull()

    // Stock repuesto y vuelto a reservar: disponible = antes de facturar; Σ movimientos = stock.
    expect(await producto(a.id)).toMatchObject({ stock: 4, reservado: 3 })
    expect(await producto(b.id)).toMatchObject({ stock: 1, reservado: 1 })
    expect(await sumaMovimientos(a.id)).toBe(movAntes + 3)
    const texto = String(f.correlativo).padStart(6, '0')
    expect(await prisma.movimientoInventario.findFirst({ where: { productoId: a.id, delta: 3 } })).toMatchObject({
      motivo: `Anulación · Factura ${texto} (${f.pedido.visible})`,
    })

    const pedido = (await request(app).get(`${PEDIDOS}/${pedidoId}`).set(auth)).body.data
    expect(pedido).toMatchObject({ estado: 'confirmado', reservadoHasta: enDias(3), factura: null })
    expect(pedido.historial.at(-1).nota).toBe(`Factura ${texto} anulada · Reservado hasta ${enDias(3).split('-').reverse().join('/')}`)

    // Nueva emisión: otro número; la anulada conserva el suyo.
    const otra = await emitir(pedidoId)
    expect(otra.status).toBe(201)
    expect(otra.body.data.correlativo).toBeGreaterThan(f.correlativo)
    expect(await prisma.factura.count({ where: { pedidoId } })).toBe(2)
    expect(await producto(a.id)).toMatchObject({ stock: 1, reservado: 0 })
  })

  it('no anula dos veces ni la factura de un pedido entregado; 404 si no existe', async () => {
    const p = await crearProducto(2)
    const anulable = (await emitir(await pedidoReservado([{ productoId: p.id, cantidad: 1 }]))).body.data
    expect((await anular(anulable.id)).status).toBe(200)
    const doble = await anular(anulable.id)
    expect(doble.status).toBe(422)
    expect(doble.body.error.message).toBe('La factura ya está anulada.')

    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 1 }])
    const f = (await emitir(pedidoId)).body.data
    expect((await request(app).patch(`${PEDIDOS}/${pedidoId}/estado`).set(auth).send({ estado: 'entregado' })).status).toBe(200)
    const entregado = await anular(f.id)
    expect(entregado.status).toBe(422)
    expect(entregado.body.error.message).toBe(`El pedido ${f.pedido.visible} ya fue entregado: la factura no se puede anular desde el flujo normal.`)
    expect((await prisma.factura.findUniqueOrThrow({ where: { id: f.id } })).estado).toBe('emitida')

    expect((await anular(999999)).status).toBe(404)
  })

  it('dos anulaciones simultáneas: 200 + 422 y una sola reposición', async () => {
    const p = await crearProducto(2)
    const f = (await emitir(await pedidoReservado([{ productoId: p.id, cantidad: 2 }]))).body.data
    const estados = (await Promise.all([anular(f.id), anular(f.id)])).map((r) => r.status).sort()
    expect(estados).toEqual([200, 422])
    expect(await producto(p.id)).toMatchObject({ stock: 2, reservado: 2 })
  })
})

describe('Circuito E2E', () => {
  it('pedido → reserva → factura → entrega: el pedido entregado ya no se edita, cancela ni elimina', async () => {
    const p = await crearProducto(3)
    const disponibleTienda = async () => (await request(app).get(`/api/v1/tienda/productos/${p.id}`)).body.data.disponible

    const pedidoId = await pedidoReservado([{ productoId: p.id, cantidad: 2 }])
    expect(await disponibleTienda()).toBe(1)
    const f = (await emitir(pedidoId)).body.data
    expect(await disponibleTienda()).toBe(1)
    expect(await producto(p.id)).toMatchObject({ stock: 1, reservado: 0 })

    const entrega = await request(app).patch(`${PEDIDOS}/${pedidoId}/estado`).set(auth).send({ estado: 'entregado' })
    expect(entrega.status).toBe(200)
    expect(entrega.body.data).toMatchObject({ estado: 'entregado', factura: { id: f.id } })
    expect((await pedidoBD(pedidoId)).historial.map((e) => e.estado)).toEqual(['registrado', 'confirmado', 'facturado', 'entregado'])

    expect((await request(app).patch(`${PEDIDOS}/${pedidoId}/estado`).set(auth).send({ estado: 'cancelado' })).status).toBe(422)
    expect((await request(app).delete(`${PEDIDOS}/${pedidoId}`).set(auth).send({ motivo: 'Prueba de borrado' })).status).toBe(422)
    expect(await sumaMovimientos(p.id)).toBe(-2)
  })
})
