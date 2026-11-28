import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L16 · Cotizaciones (29–32): emisión con precio del servidor y correlativo propio sin huecos, estados,
 * vencimiento derivado (D-07), eliminación restringida y conversión a pedido con el precio cotizado (D-18),
 * serializada por el bloqueo de la cotización.
 * Datos con el prefijo «prueba-l16», canal «Prueba L16» y clientes con teléfonos 95….
 */
const UID = 'prueba-l16'
const PREFIJO = 'prueba-l16'
const CANAL = 'Prueba L16'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const COTIZACIONES = '/api/v1/admin/cotizaciones'
const PEDIDOS = '/api/v1/admin/pedidos'

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

async function crearProducto(stock: number, precio = '10.00') {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L16-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre: `Prueba L16 producto ${secuencia}`,
      categoriaId,
      marcaId,
      modelo: '',
      precio,
      stock,
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
    },
  })
}

type Linea = { productoId: number; cantidad: number; descuento?: string }

const emitir = (lineas: Linea[], extra: Record<string, unknown> = {}) =>
  request(app)
    .post(COTIZACIONES)
    .set(auth)
    .send({ clienteId, lineas, validezDias: 15, ...extra })

async function cotizacion(lineas: Linea[], extra: Record<string, unknown> = {}): Promise<number> {
  const res = await emitir(lineas, extra)
  expect(res.status).toBe(201)
  return res.body.data.id as number
}

const datosPedido = (lineas: Linea[]) => ({
  clienteId,
  ciudad: 'Cojutepeque',
  canalId,
  formaPago: 'Efectivo',
  formaEntrega: 'Retiro en Sala de Ventas',
  lineas,
  cargos: [],
})
const convertir = (id: number, lineas: Linea[]) => request(app).post(`${COTIZACIONES}/${id}/conversion`).set(auth).send(datosPedido(lineas))
const leer = async (id: number) => (await request(app).get(`${COTIZACIONES}/${id}`).set(auth)).body.data
const ultimo = async () => (await prisma.correlativo.findUniqueOrThrow({ where: { clave: 'cotizacion' } })).ultimo
const vencerAyer = (id: number) => prisma.cotizacion.update({ where: { id }, data: { validaHasta: new Date(`${enDias(-1)}T00:00:00.000Z`) } })

async function limpiar() {
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.cotizacion.deleteMany({ where: { clienteNombre: { startsWith: 'Prueba L16' } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
  await prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '95' } } })
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L16 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L16 Marca', descripcion: '' } })).id
  canalId = (await prisma.canalVenta.create({ data: { nombre: `${CANAL} Mostrador`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '' } })).id
  clienteId = (
    await prisma.cliente.create({
      data: {
        tipo: 'empresa',
        nombre: 'Prueba L16 cliente',
        documento: '0614-160016-101-6',
        telefono: '9516-0001',
        telefonoNormalizado: '95160001',
        correo: 'l16@prueba.test',
        ciudad: '',
        direccion: '',
        notas: '',
      },
    })
  ).id
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('L16 · emisión', () => {
  it('fija precio, importes, total, número, validez, emisor y autor en el servidor', async () => {
    const a = await crearProducto(1, '100.00')
    const b = await crearProducto(0, '25.50')
    const antes = await ultimo()
    const res = await emitir(
      [
        { productoId: a.id, cantidad: 3, descuento: '10' },
        { productoId: b.id, cantidad: 2 },
      ],
      { cargos: [{ concepto: 'Instalación en oficina', monto: '30' }], notas: '  Retiro el jueves  ', validezDias: 7 },
    )
    expect(res.status).toBe(201)
    const c = res.body.data
    expect(c.numero).toBe(antes + 1)
    expect(c.codigo).toBe(`COT-${hoy.slice(0, 4)}-${String(antes + 1).padStart(3, '0')}`)
    // Sin tope de stock: se cotiza «bajo pedido» (3 > 1 y 2 > 0).
    expect(c.lineas).toEqual([
      { productoId: a.id, sku: a.sku, nombre: a.nombre, cantidad: 3, precioUnitario: '100.00', descuento: '10.00', importe: '270.00' },
      { productoId: b.id, sku: b.sku, nombre: b.nombre, cantidad: 2, precioUnitario: '25.50', descuento: '0.00', importe: '51.00' },
    ])
    expect(c.cargos).toEqual([{ id: expect.any(Number), concepto: 'Instalación en oficina', monto: '30.00' }])
    expect(c.total).toBe('351.00')
    expect(c.notas).toBe('Retiro el jueves')
    expect(c.validezDias).toBe(7)
    expect(c.validaHasta).toBe(enDias(7))
    expect(c.cliente).toEqual({ id: clienteId, nombre: 'Prueba L16 cliente', telefono: '9516-0001', correo: 'l16@prueba.test', documento: '0614-160016-101-6' })
    expect(c.emisor.nombreComercial).toEqual(expect.any(String))
    expect(c.emisor.nit).toEqual(expect.any(String))
    expect(c).toMatchObject({ estado: 'emitida', estadoEfectivo: 'emitida', convertible: true, pedido: null, creadaPor: 'Prueba' })
  })

  it('acepta un cliente ocasional con documento', async () => {
    const p = await crearProducto(5)
    const res = await request(app)
      .post(COTIZACIONES)
      .set(auth)
      .send({ cliente: { nombre: 'Prueba L16 ocasional', telefono: '9516-0002', documento: '04512378-9' }, lineas: [{ productoId: p.id, cantidad: 1 }] })
    expect(res.status).toBe(201)
    expect(res.body.data.cliente).toEqual({ id: null, nombre: 'Prueba L16 ocasional', telefono: '9516-0002', correo: '', documento: '04512378-9' })
    expect(res.body.data.validezDias).toBe(15)
  })

  it('400 si el navegador envía precios, totales o autor, sin consumir el correlativo', async () => {
    const p = await crearProducto(5)
    const antes = await ultimo()
    expect((await emitir([{ productoId: p.id, cantidad: 1, precioUnitario: '1.00' } as Linea])).status).toBe(400)
    expect((await emitir([{ productoId: p.id, cantidad: 1 }], { total: '1.00' })).status).toBe(400)
    expect((await emitir([{ productoId: p.id, cantidad: 1 }], { creadaPor: 'Otro' })).status).toBe(400)
    expect((await emitir([{ productoId: p.id, cantidad: 1 }], { validezDias: 10 })).status).toBe(400)
    expect(await ultimo()).toBe(antes)
  })

  it('422 con un producto inexistente, sin consumir el correlativo', async () => {
    const antes = await ultimo()
    const res = await emitir([{ productoId: 99_999_999, cantidad: 1 }])
    expect(res.status).toBe(422)
    expect(res.body.error.details).toEqual([{ campo: 'lineas.99999999', mensaje: 'El producto no existe.' }])
    expect(await ultimo()).toBe(antes)
  })

  it('5 emisiones simultáneas toman números consecutivos, sin huecos ni duplicados', async () => {
    const p = await crearProducto(5)
    const antes = await ultimo()
    const respuestas = await Promise.all(Array.from({ length: 5 }, () => emitir([{ productoId: p.id, cantidad: 1 }])))
    expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201, 201])
    const numeros = respuestas.map((r) => r.body.data.numero as number).sort((x, y) => x - y)
    expect(numeros).toEqual([antes + 1, antes + 2, antes + 3, antes + 4, antes + 5])
  })

  it('la línea conserva su snapshot si el producto se elimina', async () => {
    const p = await crearProducto(0, '12.00')
    const id = await cotizacion([{ productoId: p.id, cantidad: 2 }])
    await prisma.producto.delete({ where: { id: p.id } })
    const c = await leer(id)
    expect(c.lineas).toEqual([{ productoId: null, sku: p.sku, nombre: p.nombre, cantidad: 2, precioUnitario: '12.00', descuento: '0.00', importe: '24.00' }])
  })
})

describe('L16 · estados y vencimiento', () => {
  it('aceptar y rechazar solo desde una emitida y vigente', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    const res = await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'aceptada' })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ estado: 'aceptada', estadoEfectivo: 'aceptada', convertible: true })
    const otra = await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'rechazada' })
    expect(otra.status).toBe(422)
    expect((await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'emitida' })).status).toBe(400)
  })

  it('una emitida fuera de validez se ve vencida y no se acepta', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    await vencerAyer(id)
    expect(await leer(id)).toMatchObject({ estado: 'emitida', estadoEfectivo: 'vencida', convertible: false })
    const res = await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'aceptada' })
    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('vencida')
  })

  it('el último día de validez todavía es vigente (inclusive)', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    await prisma.cotizacion.update({ where: { id }, data: { validaHasta: new Date(`${hoy}T00:00:00.000Z`) } })
    expect(await leer(id)).toMatchObject({ estadoEfectivo: 'emitida', convertible: true })
  })
})

describe('L16 · conversión a pedido (D-18)', () => {
  it('respeta el precio cotizado, toma el vigente para productos nuevos y enlaza el pedido', async () => {
    const cotizado = await crearProducto(10, '100.00')
    const nuevo = await crearProducto(10, '40.00')
    const id = await cotizacion([{ productoId: cotizado.id, cantidad: 2, descuento: '5' }])
    const codigo = (await leer(id)).codigo as string
    // El catálogo cambia después de cotizar: la conversión respeta el precio cotizado.
    await prisma.producto.update({ where: { id: cotizado.id }, data: { precio: '150.00' } })

    const res = await convertir(id, [
      { productoId: cotizado.id, cantidad: 3, descuento: '5' },
      { productoId: nuevo.id, cantidad: 1 },
    ])
    expect(res.status).toBe(201)
    const pedido = res.body.data
    expect(pedido.estado).toBe('registrado')
    expect(pedido.lineas.map((l: { precioUnitario: string; importe: string }) => [l.precioUnitario, l.importe])).toEqual([
      ['100.00', '285.00'],
      ['40.00', '40.00'],
    ])
    expect(pedido.total).toBe('325.00')
    expect(pedido.cotizacion).toEqual({ id, codigo })
    expect(pedido.historial[0]).toMatchObject({ estado: 'registrado', por: 'Prueba', nota: `Desde la cotización ${codigo}` })

    const c = await leer(id)
    expect(c).toMatchObject({ estadoEfectivo: 'convertida', convertible: false, pedido: { id: pedido.id } })
    expect(c.pedido.visible).toMatch(/^ORD-\d{4}-\d{3,}$/)

    const otra = await convertir(id, [{ productoId: cotizado.id, cantidad: 1 }])
    expect(otra.status).toBe(422)
    expect(otra.body.error.message).toContain('ya originó el pedido')
  })

  it('valida el stock como el registro de pedidos (422 por línea, sin crear el pedido)', async () => {
    const p = await crearProducto(1)
    const id = await cotizacion([{ productoId: p.id, cantidad: 5 }])
    const res = await convertir(id, [{ productoId: p.id, cantidad: 5 }])
    expect(res.status).toBe(422)
    expect(res.body.error.details[0].campo).toBe(`lineas.${p.id}`)
    expect(await prisma.pedido.count({ where: { cotizacionId: id } })).toBe(0)
  })

  it('422 si está rechazada', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'rechazada' })
    const res = await convertir(id, [{ productoId: p.id, cantidad: 1 }])
    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('rechazada')
  })

  it('422 si una emitida está vencida', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    await vencerAyer(id)
    const res = await convertir(id, [{ productoId: p.id, cantidad: 1 }])
    expect(res.status).toBe(422)
    expect(res.body.error.message).toBe(`La cotización ${(await leer(id)).codigo} está vencida: emite una nueva cotización.`)
  })

  it('una aceptada tampoco se convierte después de validaHasta', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    expect((await request(app).patch(`${COTIZACIONES}/${id}/estado`).set(auth).send({ estado: 'aceptada' })).status).toBe(200)
    await vencerAyer(id)
    // Sigue mostrándose aceptada (= `effectiveStatus`), pero ya no es convertible.
    expect(await leer(id)).toMatchObject({ estado: 'aceptada', estadoEfectivo: 'aceptada', convertible: false })
    const res = await convertir(id, [{ productoId: p.id, cantidad: 1 }])
    expect(res.status).toBe(422)
    expect(res.body.error.message).toBe(`La cotización ${(await leer(id)).codigo} está vencida: emite una nueva cotización.`)
    expect(await prisma.pedido.count({ where: { cotizacionId: id } })).toBe(0)
  })

  it('dos conversiones simultáneas: una 201 y otra 422, un solo pedido', async () => {
    const p = await crearProducto(10)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    const respuestas = await Promise.all([convertir(id, [{ productoId: p.id, cantidad: 1 }]), convertir(id, [{ productoId: p.id, cantidad: 1 }])])
    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 422])
    expect(await prisma.pedido.count({ where: { cotizacionId: id } })).toBe(1)
  })

  it('al cancelar el pedido vuelve a ser convertible; con pedidos no se elimina (409)', async () => {
    const p = await crearProducto(10)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }])
    const primero = (await convertir(id, [{ productoId: p.id, cantidad: 1 }])).body.data.id as number
    expect((await request(app).patch(`${PEDIDOS}/${primero}/estado`).set(auth).send({ estado: 'cancelado' })).status).toBe(200)
    expect(await leer(id)).toMatchObject({ estadoEfectivo: 'emitida', convertible: true, pedido: null })

    const borrar = await request(app).delete(`${COTIZACIONES}/${id}`).set(auth)
    expect(borrar.status).toBe(409)
    expect(borrar.body.error.message).toContain('originó el pedido')

    expect((await convertir(id, [{ productoId: p.id, cantidad: 1 }])).status).toBe(201)
    expect(await prisma.pedido.count({ where: { cotizacionId: id } })).toBe(2)
  })
})

describe('L16 · eliminación y lectura', () => {
  it('sin pedidos se elimina (204) y luego da 404', async () => {
    const p = await crearProducto(5)
    const id = await cotizacion([{ productoId: p.id, cantidad: 1 }], { cargos: [{ concepto: 'Envío local', monto: '3.50' }] })
    expect((await request(app).delete(`${COTIZACIONES}/${id}`).set(auth)).status).toBe(204)
    expect((await request(app).get(`${COTIZACIONES}/${id}`).set(auth)).status).toBe(404)
    expect((await request(app).delete(`${COTIZACIONES}/${id}`).set(auth)).status).toBe(404)
    expect(await prisma.cargoCotizacion.count({ where: { cotizacionId: id } })).toBe(0)
  })

  it('lista paginada, las más recientes primero', async () => {
    const res = await request(app).get(`${COTIZACIONES}?limit=2`).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 })
    expect(res.body.data[0].id).toBeGreaterThan(res.body.data[1].id)
  })
})
