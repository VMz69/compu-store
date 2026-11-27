import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L13 · Pedidos: registro con precios y totales del servidor (los del navegador se rechazan),
 * edición con snapshot de precios, máquina de estados con historial, eliminación lógica y la regla
 * de L11 «cliente con pedidos → eliminación lógica». Los datos de la suite llevan el prefijo
 * «prueba-l13» (productos), canales «Prueba L13…» y clientes con teléfonos 98….
 */
const UID = 'prueba-l13'
const PREFIJO = 'prueba-l13'
const CANAL = 'Prueba L13'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const URL = '/api/v1/admin/pedidos'

let categoriaId = 0
let marcaId = 0
let secuencia = 0

async function crearProducto(nombre: string, precio: string, stock = 5) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L13-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre,
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

let telefono = 0
const crearCliente = (extra: Record<string, unknown> = {}) => {
  telefono += 1
  return prisma.cliente.create({
    data: {
      tipo: 'persona',
      nombre: `Prueba L13 cliente ${telefono}`,
      telefono: `9800-${String(telefono).padStart(4, '0')}`,
      telefonoNormalizado: `9800${String(telefono).padStart(4, '0')}`,
      correo: 'cliente@prueba.test',
      ciudad: 'Xltrece',
      direccion: '',
      notas: '',
      ...extra,
    },
  })
}

async function limpiar() {
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.oferta.deleteMany({ where: { titulo: { startsWith: CANAL } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
  await prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '98' } } })
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

let canal = { id: 0 }
let canalInactivo = { id: 0 }
let cliente = { id: 0 }
let cien = { id: 0 }
let medioCentavo = { id: 0 }
let ofertado = { id: 0 }

const cuerpo = (extra: Record<string, unknown> = {}) => ({
  clienteId: cliente.id,
  ciudad: 'Cojutepeque',
  canalId: canal.id,
  formaPago: 'Efectivo',
  formaEntrega: 'Retiro en Sala de Ventas (2da Planta)',
  lineas: [{ productoId: cien.id, cantidad: 1 }],
  ...extra,
})
const crear = (extra: Record<string, unknown> = {}) => request(app).post(URL).set(auth).send(cuerpo(extra))
const estado = (id: number, destino: string) => request(app).patch(`${URL}/${id}/estado`).set(auth).send({ estado: destino })
const nuevoPedido = async (extra: Record<string, unknown> = {}) => {
  const res = await crear(extra)
  expect(res.status).toBe(201)
  return res.body.data as { id: number; total: string; estado: string }
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L13 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L13 Marca', descripcion: '' } })).id
  canal = await prisma.canalVenta.create({ data: { nombre: `${CANAL} Mostrador`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '' } })
  canalInactivo = await prisma.canalVenta.create({
    data: { nombre: `${CANAL} Retirado`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '', activo: false },
  })
  cliente = await crearCliente()
  cien = await crearProducto('Prueba L13 cien', '100.00', 20)
  medioCentavo = await crearProducto('Prueba L13 medio centavo', '10.05')
  ofertado = await crearProducto('Prueba L13 ofertado', '50.00')
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Pedidos: registro con importes del servidor', () => {
  it('registra con precio, importes, snapshot del cliente y canal, y el historial del usuario', async () => {
    const res = await crear({ lineas: [{ productoId: cien.id, cantidad: 2 }], notas: '  Llamar antes  ' })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      cliente: { id: cliente.id, nombre: expect.stringContaining('Prueba L13 cliente'), correo: 'cliente@prueba.test' },
      canal: { id: canal.id, nombre: `${CANAL} Mostrador` },
      estado: 'registrado',
      notas: 'Llamar antes',
      reservadoHasta: null,
      factura: null,
      lineas: [{ productoId: cien.id, cantidad: 2, precioUnitario: '100.00', descuento: '0.00', importe: '200.00' }],
      cargos: [],
      total: '200.00',
      historial: [{ estado: 'registrado', por: 'Prueba', nota: null }],
    })
    expect((await request(app).get(`${URL}/${res.body.data.id}`).set(auth)).body.data.total).toBe('200.00')
  })

  it('rechaza precios, importes o totales enviados por el navegador (400)', async () => {
    expect((await crear({ total: '1.00' })).status).toBe(400)
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 1, precioUnitario: '1.00' }] })).status).toBe(400)
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 1, importe: '1.00' }] })).status).toBe(400)
  })

  it('recalcula: descuento por línea, medio centavo hacia arriba y cargos extra', async () => {
    const res = await crear({
      lineas: [
        { productoId: cien.id, cantidad: 3, descuento: 12.5 },
        { productoId: medioCentavo.id, cantidad: 1, descuento: '10' },
      ],
      cargos: [
        { concepto: 'Envío local', monto: 3.5 },
        { concepto: 'Instalación', monto: '15' },
      ],
    })

    expect(res.status).toBe(201)
    // 100 × 3 × 87.5 % = 262.50 · 10.05 × 90 % = 9.045 → 9.05 · cargos 18.50
    expect(res.body.data.lineas.map((l: { importe: string }) => l.importe)).toEqual(['262.50', '9.05'])
    expect(res.body.data.cargos.map((c: { monto: string }) => c.monto)).toEqual(['3.50', '15.00'])
    expect(res.body.data.total).toBe('290.05')
  })

  it('valida descuento, cargos, líneas y cliente (400)', async () => {
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 1, descuento: 101 }] })).status).toBe(400)
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 1, descuento: '1.234' }] })).status).toBe(400)
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 0 }] })).status).toBe(400)
    expect((await crear({ lineas: [] })).status).toBe(400)
    expect((await crear({ lineas: [{ productoId: cien.id, cantidad: 1 }, { productoId: cien.id, cantidad: 1 }] })).status).toBe(400)
    expect((await crear({ cargos: [{ concepto: 'Envío', monto: 2000.01 }] })).status).toBe(400)
    expect((await crear({ cargos: [{ concepto: 'Envío', monto: 0 }] })).status).toBe(400)
    const siete = Array.from({ length: 7 }, (_, i) => ({ concepto: `Cargo ${i}`, monto: 1 }))
    expect((await crear({ cargos: siete })).status).toBe(400)
    expect((await crear({ clienteId: null })).status).toBe(400)
  })

  it('acepta un cliente ocasional con su snapshot del cuerpo', async () => {
    const res = await crear({ clienteId: null, cliente: { nombre: 'Visitante', telefono: '7000-0000', correo: '' } })

    expect(res.status).toBe(201)
    expect(res.body.data.cliente).toEqual({ id: null, nombre: 'Visitante', telefono: '7000-0000', correo: '' })
  })

  it('422 con stock insuficiente o producto inexistente, con el detalle por línea', async () => {
    const corto = await crear({ lineas: [{ productoId: medioCentavo.id, cantidad: 6 }] })
    expect(corto.status).toBe(422)
    expect(corto.body.error.details).toEqual([
      { campo: `lineas.${medioCentavo.id}`, mensaje: 'Solo hay 5 disponible(s); ajusta la cantidad.' },
    ])

    const inexistente = await crear({ lineas: [{ productoId: 999999, cantidad: 1 }] })
    expect(inexistente.status).toBe(422)
    expect(inexistente.body.error.details[0].campo).toBe('lineas.999999')
  })

  it('422 con canal inactivo o inexistente y con cliente inactivo o eliminado', async () => {
    expect((await crear({ canalId: canalInactivo.id })).status).toBe(422)
    expect((await crear({ canalId: 999999 })).status).toBe(422)
    const inactivo = await crearCliente({ activo: false })
    expect((await crear({ clienteId: inactivo.id })).status).toBe(422)
    const eliminado = await crearCliente({ eliminadoEn: new Date() })
    expect((await crear({ clienteId: eliminado.id })).status).toBe(422)
    expect((await crear({ clienteId: 999999 })).status).toBe(422)
  })
})

describe('Pedidos: edición', () => {
  it('las líneas existentes conservan su precio; las nuevas toman el precio efectivo de hoy', async () => {
    const pedido = await nuevoPedido({ lineas: [{ productoId: cien.id, cantidad: 1 }] })
    // Después del registro, una oferta del 10 % cubre a los dos productos.
    const hoy = hoyNegocio()
    await prisma.oferta.create({
      data: {
        titulo: `${CANAL} oferta`,
        etiqueta: '',
        descripcion: '',
        tipoDescuento: 'porcentaje',
        valor: '10',
        inicio: new Date(`${hoy}T00:00:00.000Z`),
        fin: new Date(`${hoy}T00:00:00.000Z`),
        productos: { create: [{ productoId: cien.id }, { productoId: ofertado.id }] },
      },
    })

    try {
      const res = await request(app)
        .patch(`${URL}/${pedido.id}`)
        .set(auth)
        .send(cuerpo({ lineas: [{ productoId: cien.id, cantidad: 2 }, { productoId: ofertado.id, cantidad: 1 }] }))

      expect(res.status).toBe(200)
      expect(res.body.data.lineas.map((l: { precioUnitario: string }) => l.precioUnitario)).toEqual(['100.00', '45.00'])
      expect(res.body.data.total).toBe('245.00')
      expect(res.body.data.historial.at(-1)).toMatchObject({ estado: 'registrado', por: 'Prueba', nota: 'Pedido editado · total 100.00 → 245.00' })
    } finally {
      await prisma.oferta.deleteMany({ where: { titulo: { startsWith: CANAL } } })
    }
  })

  it('conserva el canal inactivo que ya tenía; uno nuevo debe estar activo', async () => {
    const otro = await prisma.canalVenta.create({ data: { nombre: `${CANAL} Temporal`, insignia: 'x', icono: 'x', descripcion: '' } })
    const pedido = await nuevoPedido({ canalId: otro.id })
    await prisma.canalVenta.update({ where: { id: otro.id }, data: { activo: false } })

    expect((await request(app).patch(`${URL}/${pedido.id}`).set(auth).send(cuerpo({ canalId: otro.id }))).status).toBe(200)
    expect((await request(app).patch(`${URL}/${pedido.id}`).set(auth).send(cuerpo({ canalId: canalInactivo.id }))).status).toBe(422)
  })

  it('404 para un pedido inexistente', async () => {
    expect((await request(app).patch(`${URL}/999999`).set(auth).send(cuerpo())).status).toBe(404)
  })
})

describe('Pedidos: máquina de estados', () => {
  it('rechaza las transiciones inválidas (422) y registra las válidas en el historial', async () => {
    const pedido = await nuevoPedido()

    expect((await estado(pedido.id, 'entregado')).status).toBe(422)
    expect((await request(app).patch(`${URL}/${pedido.id}/estado`).set(auth).send({ estado: 'confirmado' })).status).toBe(400)
    expect((await request(app).patch(`${URL}/${pedido.id}/estado`).set(auth).send({ estado: 'facturado' })).status).toBe(400)

    const cancelado = await request(app).patch(`${URL}/${pedido.id}/estado`).set(auth).send({ estado: 'cancelado', nota: 'Desistió' })
    expect(cancelado.status).toBe(200)
    expect(cancelado.body.data.estado).toBe('cancelado')
    expect(cancelado.body.data.historial.at(-1)).toMatchObject({ estado: 'cancelado', por: 'Prueba', nota: 'Desistió' })

    const otraVez = await estado(pedido.id, 'cancelado')
    expect(otraVez.status).toBe(422)
    expect(otraVez.body.error.message).toBe('No se puede pasar de "Cancelado" a "Cancelado".')
    expect((await estado(pedido.id, 'entregado')).status).toBe(422)
    expect((await request(app).patch(`${URL}/${pedido.id}`).set(auth).send(cuerpo())).status).toBe(422)
  })

  it('facturado → entregado; luego no se cancela, no se edita ni se elimina', async () => {
    const pedido = await nuevoPedido()
    // «Facturado» lo asigna la emisión de la factura (L15); aquí se escribe directamente.
    await prisma.pedido.update({ where: { id: pedido.id }, data: { estado: 'facturado' } })

    expect((await request(app).patch(`${URL}/${pedido.id}`).set(auth).send(cuerpo())).status).toBe(422)
    expect((await request(app).delete(`${URL}/${pedido.id}`).set(auth).send({ motivo: 'No procede' })).status).toBe(422)
    expect((await estado(pedido.id, 'cancelado')).status).toBe(422)
    expect((await estado(pedido.id, 'entregado')).status).toBe(200)
    expect((await estado(pedido.id, 'cancelado')).status).toBe(422)
    expect((await request(app).delete(`${URL}/${pedido.id}`).set(auth).send({ motivo: 'No procede' })).status).toBe(422)
  })

  it('de dos cancelaciones simultáneas, una falla', async () => {
    const pedido = await nuevoPedido()

    const respuestas = await Promise.all([estado(pedido.id, 'cancelado'), estado(pedido.id, 'cancelado')])

    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422])
    const eventos = await prisma.eventoPedido.count({ where: { pedidoId: pedido.id, estado: 'cancelado' } })
    expect(eventos).toBe(1)
  })
})

describe('Pedidos: eliminación lógica y listado', () => {
  it('exige motivo, saca el pedido del listado y lo conserva para auditoría', async () => {
    const pedido = await nuevoPedido()

    expect((await request(app).delete(`${URL}/${pedido.id}`).set(auth).send({})).status).toBe(400)
    expect((await request(app).delete(`${URL}/${pedido.id}`).set(auth).send({ motivo: 'Pedido duplicado' })).status).toBe(204)

    expect((await request(app).get(`${URL}/${pedido.id}`).set(auth)).status).toBe(404)
    expect((await request(app).delete(`${URL}/${pedido.id}`).set(auth).send({ motivo: 'Pedido duplicado' })).status).toBe(404)
    const lista = await request(app).get(`${URL}?limit=100`).set(auth)
    expect(lista.body.data.some((p: { id: number }) => p.id === pedido.id)).toBe(false)
    const fila = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id }, include: { historial: true } })
    expect(fila.eliminadoEn).not.toBeNull()
    expect(fila.motivoEliminacion).toBe('Pedido duplicado')
    expect(fila.historial.at(-1)?.nota).toBe('Pedido eliminado · Pedido duplicado')
  })

  it('lista los más recientes primero, filtra por estado y pagina (D-06)', async () => {
    const primero = await nuevoPedido()
    const segundo = await nuevoPedido()

    const res = await request(app).get(`${URL}?estado=registrado&limit=2`).set(auth)

    expect(res.status).toBe(200)
    expect(res.body.data.map((p: { id: number }) => p.id)).toEqual([segundo.id, primero.id])
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 })
    expect(res.body.data.every((p: { estado: string }) => p.estado === 'registrado')).toBe(true)
    expect((await request(app).get(`${URL}?estado=otro`).set(auth)).status).toBe(400)
  })
})

describe('Canal renombrado', () => {
  it('el pedido muestra el nombre actual y conserva el original como snapshot', async () => {
    const temporal = await prisma.canalVenta.create({ data: { nombre: `${CANAL} Antes`, insignia: 'x', icono: 'x', descripcion: '' } })
    const pedido = await nuevoPedido({ canalId: temporal.id })

    const ajuste = await request(app).patch(`/api/v1/admin/canales-venta/${temporal.id}`).set(auth).send({ nombre: `${CANAL} Después` })
    expect(ajuste.status).toBe(200)

    expect((await request(app).get(`${URL}/${pedido.id}`).set(auth)).body.data.canal.nombre).toBe(`${CANAL} Después`)
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).canalNombre).toBe(`${CANAL} Antes`)
    expect((await request(app).delete(`/api/v1/admin/canales-venta/${temporal.id}`).set(auth)).status).toBe(409)
  })
})

describe('Clientes con pedidos (regla de L11 completada en L13)', () => {
  const CLIENTES = '/api/v1/admin/clientes'

  it('con pedidos: eliminación lógica; el pedido conserva el cliente y un alta con su teléfono o DUI da 409', async () => {
    const conPedidos = await crearCliente({ documento: '09876543-2' })
    const pedido = await nuevoPedido({ clienteId: conPedidos.id })

    expect((await request(app).delete(`${CLIENTES}/${conPedidos.id}`).set(auth)).status).toBe(204)

    expect((await request(app).get(`${CLIENTES}/${conPedidos.id}`).set(auth)).status).toBe(404)
    expect((await request(app).patch(`${CLIENTES}/${conPedidos.id}`).set(auth).send({ notas: 'x' })).status).toBe(404)
    const busqueda = await request(app).get(`${CLIENTES}?q=${encodeURIComponent(conPedidos.nombre)}`).set(auth)
    expect(busqueda.body.data).toEqual([])
    expect((await prisma.cliente.findUniqueOrThrow({ where: { id: conPedidos.id } })).eliminadoEn).not.toBeNull()
    const enPedido = (await request(app).get(`${URL}/${pedido.id}`).set(auth)).body.data.cliente
    expect(enPedido).toMatchObject({ id: conPedidos.id, nombre: conPedidos.nombre })

    const mismoTelefono = await request(app)
      .post(CLIENTES)
      .set(auth)
      .send({ tipo: 'persona', nombre: 'Otra persona', telefono: conPedidos.telefono })
    expect(mismoTelefono.status).toBe(409)
    expect(mismoTelefono.body.error.message).toBe('Este teléfono pertenece a un cliente eliminado.')
    const mismoDui = await request(app)
      .post(CLIENTES)
      .set(auth)
      .send({ tipo: 'persona', nombre: 'Otra persona', telefono: '9899-0001', documento: '09876543-2' })
    expect(mismoDui.status).toBe(409)
    expect(mismoDui.body.error.message).toBe('Este DUI pertenece a un cliente eliminado.')
  })

  it('sin pedidos: borrado real', async () => {
    const sinPedidos = await crearCliente()

    expect((await request(app).delete(`${CLIENTES}/${sinPedidos.id}`).set(auth)).status).toBe(204)
    expect(await prisma.cliente.findUnique({ where: { id: sinPedidos.id } })).toBeNull()
  })
})
