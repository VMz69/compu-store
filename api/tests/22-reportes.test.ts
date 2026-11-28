import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Prisma } from '../generated/prisma/client.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L18 · Reportes (17, 28): métricas del tablero e historial de compra de los clientes, calculadas en el
 * servidor sobre los pedidos vigentes. Datos con el canal «Prueba L18» y teléfonos 9418-….
 * La BD de pruebas acumula pedidos de otros archivos: el tablero se compara por diferencia.
 */
const UID = 'prueba-l18'
const CANAL = 'Prueba L18'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const TABLERO = '/api/v1/admin/reportes/tablero'
const CLIENTES = '/api/v1/admin/reportes/clientes'

let canal = { id: 0, nombre: '' }

type Estado = 'registrado' | 'confirmado' | 'facturado' | 'entregado' | 'cancelado'

const crearPedido = (estado: Estado, total: string, extra: Partial<Prisma.PedidoUncheckedCreateInput> = {}) =>
  prisma.pedido.create({
    data: {
      clienteNombre: 'Cliente L18',
      clienteTelefono: '0000-0000',
      clienteCorreo: '',
      ciudad: 'Cojutepeque',
      canalId: canal.id,
      canalNombre: canal.nombre,
      formaPago: 'Efectivo',
      formaEntrega: 'Retiro en Sala de Ventas (2da Planta)',
      notas: '',
      estado,
      total,
      ...extra,
    },
  })

const crearCliente = (n: number, extra: Partial<Prisma.ClienteUncheckedCreateInput> = {}) =>
  prisma.cliente.create({
    data: {
      tipo: 'persona',
      nombre: `Prueba L18 cliente ${n}`,
      telefono: `9418-000${n}`,
      telefonoNormalizado: `9418000${n}`,
      correo: '',
      ciudad: '',
      direccion: '',
      notas: '',
      ...extra,
    },
  })

interface Estadistica {
  clienteId: number
  pedidos: number
  totalComprado: string
  ultimoPedido: string | null
}

/** Todas las páginas del historial (la BD de pruebas puede tener más clientes). */
async function todasLasEstadisticas(): Promise<Estadistica[]> {
  const filas: Estadistica[] = []
  for (let page = 1; ; page++) {
    const res = await request(app).get(CLIENTES).query({ page, limit: 100 }).set(auth)
    expect(res.status).toBe(200)
    filas.push(...(res.body.data as Estadistica[]))
    if (page >= res.body.meta.totalPages) return filas
  }
}

async function limpiar() {
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
  await prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '9418' } } })
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  canal = await prisma.canalVenta.create({ data: { nombre: `${CANAL} Mostrador`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '' } })
})
afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('L18 · tablero (28)', () => {
  it('cuenta por estado, activos y venta efectiva en DECIMAL, sin los pedidos eliminados', async () => {
    const antes = (await request(app).get(TABLERO).set(auth)).body.data.pedidos

    await crearPedido('registrado', '10.00')
    await crearPedido('confirmado', '20.00')
    await crearPedido('facturado', '30.10')
    await crearPedido('entregado', '40.25')
    await crearPedido('cancelado', '50.00')
    await crearPedido('entregado', '99.99', { eliminadoEn: new Date(), motivoEliminacion: 'prueba' })

    const res = await request(app).get(TABLERO).set(auth)
    expect(res.status).toBe(200)
    const despues = res.body.data.pedidos
    const delta = (clave: string) => despues[clave] - antes[clave]
    expect({
      total: delta('total'),
      registrados: delta('registrados'),
      confirmados: delta('confirmados'),
      facturados: delta('facturados'),
      entregados: delta('entregados'),
      cancelados: delta('cancelados'),
      activos: delta('activos'),
    }).toEqual({ total: 5, registrados: 1, confirmados: 1, facturados: 1, entregados: 1, cancelados: 1, activos: 3 })
    // 30.10 + 40.25 sin error de coma flotante; el pedido eliminado (99.99) no cuenta.
    expect(despues.ventas).toMatch(/^\d+\.\d{2}$/)
    expect(new Prisma.Decimal(despues.ventas).sub(antes.ventas).toFixed(2)).toBe('70.35')
  })
})

describe('L18 · historial de clientes (17)', () => {
  it('une por cliente y, sin cliente, por teléfono; solo facturado y entregado suman', async () => {
    const a = await crearCliente(1)
    const b = await crearCliente(2)
    const sinPedidos = await crearCliente(3)
    const eliminado = await crearCliente(4, { eliminadoEn: new Date() })

    await crearPedido('facturado', '12.50', { clienteId: a.id, creadoEn: new Date('2026-10-01T15:00:00Z') })
    await crearPedido('cancelado', '5.00', { clienteId: a.id, creadoEn: new Date('2026-10-02T15:00:00Z') })
    // Cliente ocasional con el mismo teléfono escrito de otra forma: es de A (regla del admin).
    await crearPedido('entregado', '7.55', { clienteTelefono: '9418 0001', creadoEn: new Date('2026-11-03T16:30:00Z') })
    // Con clienteId manda el enlace real aunque el teléfono sea el de A.
    await crearPedido('registrado', '8.00', { clienteId: b.id, clienteTelefono: '9418-0001' })
    // Eliminado lógicamente: no cuenta.
    await crearPedido('entregado', '100.00', { clienteId: a.id, eliminadoEn: new Date(), motivoEliminacion: 'prueba' })
    await crearPedido('facturado', '3.00', { clienteId: eliminado.id })

    const filas = await todasLasEstadisticas()
    const de = (id: number) => filas.find((f) => f.clienteId === id)

    expect(de(a.id)).toEqual({ clienteId: a.id, pedidos: 3, totalComprado: '20.05', ultimoPedido: '2026-11-03T16:30:00.000Z' })
    expect(de(b.id)).toMatchObject({ pedidos: 1, totalComprado: '0.00' })
    expect(de(sinPedidos.id)).toEqual({ clienteId: sinPedidos.id, pedidos: 0, totalComprado: '0.00', ultimoPedido: null })
    // Un cliente eliminado sale del directorio y del historial.
    expect(de(eliminado.id)).toBeUndefined()
  })

  it('pagina con meta (D-06) y rechaza un límite mayor que 100', async () => {
    const res = await request(app).get(CLIENTES).query({ page: 1, limit: 1 }).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1 })
    expect(res.body.meta.totalPages).toBe(res.body.meta.total)
    expect((await request(app).get(CLIENTES).query({ limit: 101 }).set(auth)).status).toBe(400)
  })
})
