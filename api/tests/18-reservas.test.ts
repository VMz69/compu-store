import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'
import { barrerReservasVencidas } from '../src/11-pipeline-pedidos/00-director-pedidos.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L14 · Reservas (23–25): «Confirmar y reservar» con vigencia, stock reservado y disponible
 * (físico − reservado), concurrencia sobre la última unidad, idempotencia, liberación al cancelar,
 * eliminar o editar, vencimiento por barrido y en línea (D-07), y la regla de ajustes bajo lo reservado.
 * Datos con el prefijo «prueba-l14», canal «Prueba L14» y clientes con teléfonos 97….
 */
const UID = 'prueba-l14'
const PREFIJO = 'prueba-l14'
const CANAL = 'Prueba L14'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const URL = '/api/v1/admin/pedidos'

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

async function crearProducto(stock: number) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L14-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre: `Prueba L14 producto ${secuencia}`,
      categoriaId,
      marcaId,
      modelo: '',
      precio: '10.00',
      stock,
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
    },
  })
}

type Linea = { productoId: number; cantidad: number }
const cuerpo = (lineas: Linea[]) => ({
  clienteId,
  ciudad: 'Cojutepeque',
  canalId,
  formaPago: 'Efectivo',
  formaEntrega: 'Retiro en Sala de Ventas (2da Planta)',
  lineas,
})

async function nuevoPedido(lineas: Linea[]): Promise<number> {
  const res = await request(app).post(URL).set(auth).send(cuerpo(lineas))
  expect(res.status).toBe(201)
  return res.body.data.id as number
}

const reservar = (id: number, hasta: string = enDias(3)) => request(app).post(`${URL}/${id}/reserva`).set(auth).send({ hasta })
const reservado = async (productoId: number) => (await prisma.producto.findUniqueOrThrow({ where: { id: productoId } })).reservado
const pedido = (id: number) => prisma.pedido.findUniqueOrThrow({ where: { id }, include: { historial: { orderBy: { id: 'asc' } } } })
/** Simula que la reserva caducó (sin pasar por el barrido). */
const caducar = (id: number) => prisma.pedido.update({ where: { id }, data: { reservadoHasta: new Date(`${enDias(-1)}T00:00:00.000Z`) } })

async function limpiar() {
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
  await prisma.cliente.deleteMany({ where: { telefonoNormalizado: { startsWith: '97' } } })
  await prisma.movimientoInventario.deleteMany({ where: { producto: { slug: { startsWith: PREFIJO } } } })
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L14 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L14 Marca', descripcion: '' } })).id
  canalId = (await prisma.canalVenta.create({ data: { nombre: `${CANAL} Mostrador`, insignia: 'x', icono: 'fa-solid fa-store', descripcion: '' } })).id
  clienteId = (
    await prisma.cliente.create({
      data: { tipo: 'persona', nombre: 'Prueba L14 cliente', telefono: '9714-0001', telefonoNormalizado: '97140001', correo: '', ciudad: '', direccion: '', notas: '' },
    })
  ).id
})

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Reservar', () => {
  it('aparta el stock con vigencia: el disponible baja en la tienda, el carrito y el registro de pedidos', async () => {
    const producto = await crearProducto(5)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])

    const res = await reservar(id, enDias(3))

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ estado: 'confirmado', reservadoHasta: enDias(3) })
    expect(res.body.data.historial.at(-1)).toMatchObject({ estado: 'confirmado', por: 'Prueba' })
    expect(await reservado(producto.id)).toBe(2)
    const publico = await request(app).get(`/api/v1/tienda/productos/${producto.id}`)
    expect(publico.body.data.disponible).toBe(3)
    const carrito = await request(app).post('/api/v1/tienda/carrito/validar').send({ lineas: [{ productoId: producto.id, cantidad: 5 }] })
    expect(carrito.body.data.lineas[0].cantidadDisponible).toBe(3)
    const otro = await request(app).post(URL).set(auth).send(cuerpo([{ productoId: producto.id, cantidad: 4 }]))
    expect(otro.status).toBe(422)
  })

  it('valida la fecha: de hoy a hoy + 15 (422) y el formato (400)', async () => {
    const producto = await crearProducto(5)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])

    expect((await reservar(id, enDias(-1))).status).toBe(422)
    expect((await reservar(id, enDias(16))).status).toBe(422)
    expect((await reservar(id, 'mañana')).status).toBe(400)
    expect((await request(app).post(`${URL}/${id}/reserva`).set(auth).send({ hasta: enDias(1), extra: 1 })).status).toBe(400)
    expect(await reservado(producto.id)).toBe(0)
    expect((await reservar(id, enDias(15))).status).toBe(200)
  })

  it('es idempotente: repetir la misma reserva no aparta más; otra fecha o estado → 422', async () => {
    const producto = await crearProducto(5)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])

    expect((await reservar(id, enDias(2))).status).toBe(200)
    expect((await reservar(id, enDias(2))).status).toBe(200)
    expect(await reservado(producto.id)).toBe(2)
    expect((await pedido(id)).historial.filter((e) => e.estado === 'confirmado')).toHaveLength(1)
    expect((await reservar(id, enDias(4))).status).toBe(422)

    const cancelado = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])
    await request(app).patch(`${URL}/${cancelado}/estado`).set(auth).send({ estado: 'cancelado' })
    expect((await reservar(cancelado)).status).toBe(422)
    expect((await reservar(999999)).status).toBe(404)
  })

  it('cierre de L14: de dos confirmaciones simultáneas sobre la última unidad, una falla', async () => {
    const producto = await crearProducto(1)
    const a = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])
    const b = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])

    const respuestas = await Promise.all([reservar(a), reservar(b)])

    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422])
    const rechazo = respuestas.find((r) => r.status === 422)
    expect(rechazo?.body.error.details).toEqual([{ campo: `lineas.${producto.id}`, mensaje: 'Sin stock disponible: quita el producto.' }])
    expect(await reservado(producto.id)).toBe(1)
  })
})

describe('Liberación', () => {
  it('cancelar o eliminar un pedido reservado libera sus unidades', async () => {
    const producto = await crearProducto(4)
    const a = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])
    const b = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])
    await reservar(a)
    await reservar(b)
    expect(await reservado(producto.id)).toBe(4)

    const cancelado = await request(app).patch(`${URL}/${a}/estado`).set(auth).send({ estado: 'cancelado' })
    expect(cancelado.body.data).toMatchObject({ estado: 'cancelado', reservadoHasta: null })
    expect(await reservado(producto.id)).toBe(2)
    expect((await request(app).delete(`${URL}/${b}`).set(auth).send({ motivo: 'Duplicado por error' })).status).toBe(204)
    expect(await reservado(producto.id)).toBe(0)
  })

  it('editar un pedido reservado mueve la reserva (excluye la propia) y no cambia nada si no alcanza', async () => {
    const uno = await crearProducto(3)
    const dos = await crearProducto(2)
    const id = await nuevoPedido([{ productoId: uno.id, cantidad: 2 }])
    await reservar(id, enDias(5))

    const crece = await request(app).patch(`${URL}/${id}`).set(auth).send(cuerpo([{ productoId: uno.id, cantidad: 3 }]))
    expect(crece.status).toBe(200)
    expect(crece.body.data).toMatchObject({ estado: 'confirmado', reservadoHasta: enDias(5) })
    expect(await reservado(uno.id)).toBe(3)

    const excede = await request(app).patch(`${URL}/${id}`).set(auth).send(cuerpo([{ productoId: uno.id, cantidad: 4 }]))
    expect(excede.status).toBe(422)
    expect(await reservado(uno.id)).toBe(3)

    const cambia = await request(app).patch(`${URL}/${id}`).set(auth).send(cuerpo([{ productoId: dos.id, cantidad: 2 }]))
    expect(cambia.status).toBe(200)
    expect([await reservado(uno.id), await reservado(dos.id)]).toEqual([0, 2])
  })
})

describe('Vencimiento (D-07)', () => {
  it('el barrido devuelve el pedido a Registrado, libera el stock y deja el evento del sistema', async () => {
    const producto = await crearProducto(3)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 3 }])
    await reservar(id)
    await caducar(id)

    expect(await barrerReservasVencidas()).toContain(id)

    const vencido = await pedido(id)
    expect(vencido).toMatchObject({ estado: 'registrado', reservadoHasta: null })
    expect(vencido.historial.at(-1)).toMatchObject({ estado: 'registrado', por: 'Sistema', usuarioId: null })
    expect(vencido.historial.at(-1)?.nota).toMatch(/^Reserva vencida \(\d{2}\/\d{2}\/\d{4}\): stock liberado$/)
    expect(await reservado(producto.id)).toBe(0)
    expect(await barrerReservasVencidas()).not.toContain(id)
  })

  it('dos barridos simultáneos liberan una sola vez', async () => {
    const producto = await crearProducto(2)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])
    await reservar(id)
    await caducar(id)

    const [primero, segundo] = await Promise.all([barrerReservasVencidas(), barrerReservasVencidas()])

    expect([...primero, ...segundo].filter((x) => x === id)).toHaveLength(1)
    expect(await reservado(producto.id)).toBe(0)
    expect((await pedido(id)).historial.filter((e) => e.por === 'Sistema')).toHaveLength(1)
  })

  it('sin barrido, la tienda, el carrito y otra reserva ven la unidad liberada (perezosa)', async () => {
    const producto = await crearProducto(1)
    const viejo = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])
    const nuevo = await nuevoPedido([{ productoId: producto.id, cantidad: 1 }])
    await reservar(viejo)
    await caducar(viejo)

    expect((await request(app).get(`/api/v1/tienda/productos/${producto.id}`)).body.data.disponible).toBe(1)
    expect((await pedido(viejo)).estado).toBe('registrado')

    await reservar(viejo)
    await caducar(viejo)
    const carrito = await request(app).post('/api/v1/tienda/carrito/validar').send({ lineas: [{ productoId: producto.id, cantidad: 1 }] })
    expect(carrito.body.data.lineas[0].cantidadDisponible).toBe(1)

    await reservar(viejo)
    await caducar(viejo)
    expect((await reservar(nuevo)).status).toBe(200)
    expect((await pedido(viejo)).estado).toBe('registrado')
    expect(await reservado(producto.id)).toBe(1)
  })

  it('reservar de nuevo un pedido vencido que el barrido no procesó lo vence en línea y lo reserva', async () => {
    const producto = await crearProducto(2)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])
    await reservar(id)
    await caducar(id)

    const res = await reservar(id, enDias(7))

    expect(res.status).toBe(200)
    expect(res.body.data.historial.slice(-2).map((e: { estado: string; por: string }) => [e.estado, e.por])).toEqual([
      ['registrado', 'Sistema'],
      ['confirmado', 'Prueba'],
    ])
    expect(await reservado(producto.id)).toBe(2)
  })
})

describe('Ajustes de inventario bajo lo reservado', () => {
  it('422 que nombra los pedidos y el camino a seguir; por encima de lo reservado sí se ajusta', async () => {
    const producto = await crearProducto(3)
    const id = await nuevoPedido([{ productoId: producto.id, cantidad: 2 }])
    await reservar(id)
    const visible = `ORD-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`

    const rapido = await request(app).post(`/api/v1/admin/productos/${producto.id}/ajustes`).set(auth).send({ delta: -2 })
    expect(rapido.status).toBe(422)
    expect(rapido.body.error.message).toContain(`el pedido ${visible} (2)`)
    expect(rapido.body.error.message).toContain('cancela o reduce esos pedidos')

    const ficha = await request(app)
      .put(`/api/v1/admin/productos/${producto.id}/existencias`)
      .set(auth)
      .send({ controlLotes: false, stock: 1, stockEsperado: 3 })
    expect(ficha.status).toBe(422)
    const lotes = await request(app)
      .put(`/api/v1/admin/productos/${producto.id}/existencias`)
      .set(auth)
      .send({ controlLotes: true, lotes: [{ numero: 'L14-A', cantidad: 1, vence: null }], stockEsperado: 3 })
    expect(lotes.status).toBe(422)
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: producto.id } })).stock).toBe(3)

    expect((await request(app).post(`/api/v1/admin/productos/${producto.id}/ajustes`).set(auth).send({ delta: -1 })).status).toBe(200)
  })

  it('la BD rechaza reservado > stock aunque se salte el service (CHECK)', async () => {
    const producto = await crearProducto(1)
    await expect(prisma.producto.update({ where: { id: producto.id }, data: { reservado: 2 } })).rejects.toThrow()
  })
})

describe('Invariante', () => {
  it('reservado = Σ unidades de los pedidos reservados vigentes, y nunca supera el stock', async () => {
    const productos = await prisma.producto.findMany({ select: { id: true, stock: true, reservado: true } })
    const lineas = await prisma.lineaPedido.groupBy({
      by: ['productoId'],
      where: { pedido: { estado: 'confirmado', eliminadoEn: null } },
      _sum: { cantidad: true },
    })
    const esperado = new Map(lineas.map((l) => [l.productoId, l._sum.cantidad ?? 0]))
    for (const p of productos) {
      expect({ id: p.id, reservado: p.reservado }).toEqual({ id: p.id, reservado: esperado.get(p.id) ?? 0 })
      expect(p.reservado).toBeLessThanOrEqual(p.stock)
    }
  })
})
