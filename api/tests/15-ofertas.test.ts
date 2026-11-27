import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L12 · Ofertas: CRUD, programación, vigencia, pausa y reglas (bajo costo, precio > 0, solapamiento),
 * y el precio efectivo como cálculo único para admin, tienda y carrito. Los datos de la suite
 * llevan el prefijo «prueba-l12» (productos) y el título «Prueba L12» (ofertas).
 */
const UID = 'prueba-l12'
const PREFIJO = 'prueba-l12'
const TITULO = 'Prueba L12'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const URL = '/api/v1/admin/ofertas'

/** Fecha de calendario desplazada `dias` respecto a `YYYY-MM-DD`. */
const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}
const HOY = hoyNegocio()
const fechaBD = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`)

let categoriaId = 0
let marcaId = 0
let secuencia = 0

/** Producto de prueba: precio con IVA 13 % y costo sin IVA opcional. */
async function crearProducto(nombre: string, precio: string, costo: string | null = null, precioAnterior: string | null = null) {
  secuencia += 1
  return prisma.producto.create({
    data: {
      sku: `L12-${Date.now().toString(36).toUpperCase()}-${secuencia}`,
      slug: `${PREFIJO}-${Date.now()}-${secuencia}`,
      nombre,
      categoriaId,
      marcaId,
      modelo: '',
      precio,
      costo,
      precioAnterior,
      stock: 5,
      descripcion: '',
      compatibilidad: '',
      conectividad: '',
    },
  })
}

const limpiarOfertas = () => prisma.oferta.deleteMany({ where: { titulo: { startsWith: TITULO } } })

async function limpiar() {
  await limpiarOfertas()
  await prisma.producto.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.categoria.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
  await prisma.marca.deleteMany({ where: { slug: { startsWith: PREFIJO } } })
}

const cuerpo = (extra: Record<string, unknown>) => ({
  titulo: `${TITULO} oferta`,
  tipoDescuento: 'porcentaje',
  valor: '10',
  inicio: HOY,
  fin: sumarDias(HOY, 10),
  ...extra,
})
const crear = (extra: Record<string, unknown>) => request(app).post(URL).set(auth).send(cuerpo(extra))

/** Oferta escrita directamente en la BD (p. ej. una ya vencida, que la API no deja crear). */
const insertar = (productoId: number, datos: { inicio: string; fin: string; pausada?: boolean; valor?: string }) =>
  prisma.oferta.create({
    data: {
      titulo: `${TITULO} directa`,
      etiqueta: '',
      descripcion: '',
      tipoDescuento: 'porcentaje',
      valor: datos.valor ?? '10',
      inicio: fechaBD(datos.inicio),
      fin: fechaBD(datos.fin),
      pausada: datos.pausada ?? false,
      productos: { create: [{ productoId }] },
    },
  })

/** 113.00 con costo 90.00: con 10 % queda en 101.70 = 90.00 sin IVA (margen 0, permitido). */
let conCosto = { id: 0 }
/** 10.05 sin costo: con 10 % → 9.045 → 9.05 (redondeo exacto en DECIMAL). */
let medioCentavo = { id: 0 }
let otro = { id: 0 }

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  categoriaId = (await prisma.categoria.create({ data: { slug: `${PREFIJO}-cat`, nombre: 'Prueba L12 Categoría', icono: 'x', descripcion: '' } })).id
  marcaId = (await prisma.marca.create({ data: { slug: `${PREFIJO}-marca`, nombre: 'Prueba L12 Marca', descripcion: '' } })).id
  conCosto = await crearProducto('Prueba L12 con costo', '113.00', '90.00')
  medioCentavo = await crearProducto('Prueba L12 medio centavo', '10.05')
  otro = await crearProducto('Prueba L12 otro', '20.00', null, '25.00')
})

beforeEach(limpiarOfertas)

afterAll(async () => {
  await limpiar()
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('hoyNegocio', () => {
  it('usa la fecha de El Salvador (UTC−6), no la de UTC', () => {
    expect(hoyNegocio(new Date('2026-11-27T03:00:00Z'))).toBe('2026-11-26')
    expect(hoyNegocio(new Date('2026-11-27T06:00:00Z'))).toBe('2026-11-27')
  })
})

describe('Ofertas: alta, lectura, edición, pausa y eliminación', () => {
  it('crea y responde el contrato con el precio de oferta calculado por el servidor', async () => {
    const res = await crear({ titulo: `  ${TITULO} audio  `, etiqueta: 'OFERTA', productoIds: [medioCentavo.id, conCosto.id] })
    expect(res.status).toBe(201)
    expect(res.body.data).toEqual({
      id: expect.any(Number),
      titulo: `${TITULO} audio`,
      etiqueta: 'OFERTA',
      descripcion: '',
      tipoDescuento: 'porcentaje',
      valor: '10.00',
      inicio: HOY,
      fin: sumarDias(HOY, 10),
      pausada: false,
      productos: [
        { productoId: Math.min(conCosto.id, medioCentavo.id), precioOferta: conCosto.id < medioCentavo.id ? '101.70' : '9.05' },
        { productoId: Math.max(conCosto.id, medioCentavo.id), precioOferta: conCosto.id < medioCentavo.id ? '9.05' : '101.70' },
      ],
      creadaEn: expect.any(String),
    })
    const uno = await request(app).get(`${URL}/${res.body.data.id}`).set(auth)
    expect(uno.body.data).toEqual(res.body.data)
    const lista = await request(app).get(`${URL}?limit=100`).set(auth)
    expect(lista.status).toBe(200)
    expect(lista.body.meta).toMatchObject({ page: 1, limit: 100 })
    expect(lista.body.data.map((o: { id: number }) => o.id)).toContain(res.body.data.id)
  })

  it('monto fijo: precio − valor', async () => {
    const res = await crear({ tipoDescuento: 'monto', valor: '2.50', productoIds: [otro.id] })
    expect(res.status).toBe(201)
    expect(res.body.data.productos).toEqual([{ productoId: otro.id, precioOferta: '17.50' }])
  })

  it('edita (también los productos) y conserva lo no enviado', async () => {
    const { body } = await crear({ productoIds: [otro.id] })
    const res = await request(app).patch(`${URL}/${body.data.id}`).set(auth).send({ valor: '20', productoIds: [medioCentavo.id] })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ titulo: `${TITULO} oferta`, valor: '20.00', productos: [{ productoId: medioCentavo.id, precioOferta: '8.04' }] })
  })

  it('pausa y reanuda; una vigente no se elimina hasta pausarla', async () => {
    const { body } = await crear({ productoIds: [otro.id] })
    const id = body.data.id as number
    const vigente = await request(app).delete(`${URL}/${id}`).set(auth)
    expect(vigente.status).toBe(422)
    expect(vigente.body.error.message).toBe('Pausa la oferta antes de eliminarla.')
    expect((await request(app).patch(`${URL}/${id}/pausa`).set(auth).send({ pausada: true })).body.data.pausada).toBe(true)
    expect((await request(app).patch(`${URL}/${id}/pausa`).set(auth).send({ pausada: false })).body.data.pausada).toBe(false)
    await request(app).patch(`${URL}/${id}/pausa`).set(auth).send({ pausada: true })
    expect((await request(app).delete(`${URL}/${id}`).set(auth)).status).toBe(204)
    expect((await request(app).get(`${URL}/${id}`).set(auth)).status).toBe(404)
  })

  it('una programada se elimina sin pausarla', async () => {
    const { body } = await crear({ inicio: sumarDias(HOY, 3), fin: sumarDias(HOY, 5), productoIds: [otro.id] })
    expect((await request(app).delete(`${URL}/${body.data.id}`).set(auth)).status).toBe(204)
  })

  it('una vencida es historial: no se edita ni se pausa, pero se elimina', async () => {
    const vencida = await insertar(otro.id, { inicio: sumarDias(HOY, -10), fin: sumarDias(HOY, -1) })
    const editar = await request(app).patch(`${URL}/${vencida.id}`).set(auth).send({ titulo: `${TITULO} nueva` })
    expect(editar.status).toBe(422)
    const pausar = await request(app).patch(`${URL}/${vencida.id}/pausa`).set(auth).send({ pausada: true })
    expect(pausar.status).toBe(422)
    expect((await request(app).delete(`${URL}/${vencida.id}`).set(auth)).status).toBe(204)
  })

  it('404 si no existe', async () => {
    expect((await request(app).get(`${URL}/999999`).set(auth)).status).toBe(404)
    expect((await request(app).patch(`${URL}/999999`).set(auth).send({ titulo: 'Algo nuevo' })).status).toBe(404)
    expect((await request(app).delete(`${URL}/999999`).set(auth)).status).toBe(404)
  })
})

describe('Ofertas: reglas', () => {
  it('400 por datos inválidos y campos desconocidos', async () => {
    for (const extra of [
      { titulo: 'ab', productoIds: [otro.id] },
      { valor: '0', productoIds: [otro.id] },
      { valor: 'diez', productoIds: [otro.id] },
      { valor: '91', productoIds: [otro.id] },
      { inicio: '2026-02-30', productoIds: [otro.id] },
      { fin: sumarDias(HOY, -1), inicio: HOY, productoIds: [otro.id] },
      { productoIds: [] },
      { productoIds: [otro.id, otro.id] },
      { productoIds: [otro.id], precio: '1.00' },
    ]) {
      const res = await crear(extra)
      expect(res.status, JSON.stringify(extra)).toBe(400)
    }
    expect((await crear({ valor: '90', productoIds: [medioCentavo.id] })).status).toBe(201)
  })

  it('422: termina en el pasado (al crear) o el producto no existe', async () => {
    const pasado = await crear({ inicio: sumarDias(HOY, -5), fin: sumarDias(HOY, -1), productoIds: [otro.id] })
    expect(pasado.status).toBe(422)
    expect(pasado.body.error.message).toBe('La oferta terminaría en el pasado.')
    expect((await crear({ productoIds: [999999] })).status).toBe(422)
  })

  it('422 si algún producto queda bajo su costo (margen 0 sí se permite)', async () => {
    const bajo = await crear({ valor: '15', productoIds: [conCosto.id, otro.id] })
    expect(bajo.status).toBe(422)
    expect(bajo.body.error.message).toBe('1 producto(s) quedarían bajo su costo. Baja el descuento o quítalos.')
    expect((await crear({ valor: '10', productoIds: [conCosto.id] })).status).toBe(201)
  })

  it('422 si el precio de oferta queda en $0.00', async () => {
    const gratis = await crear({ tipoDescuento: 'monto', valor: '20.00', productoIds: [otro.id] })
    expect(gratis.status).toBe(422)
    expect(gratis.body.error.message).toBe('1 producto(s) quedarían en $0.00. Baja el descuento o quítalos.')
  })

  it('las reglas se aplican con los valores resultantes al editar', async () => {
    const caro = await crearProducto('Prueba L12 caro', '200.00')
    const { body } = await crear({ tipoDescuento: 'monto', valor: '95', productoIds: [caro.id] })
    expect(body.data.productos[0].precioOferta).toBe('105.00')
    // $95 es válido, pero al pasar a porcentaje sin enviar el valor resultaría un 95 % (máx. 90).
    expect((await request(app).patch(`${URL}/${body.data.id}`).set(auth).send({ tipoDescuento: 'porcentaje' })).status).toBe(400)
    // Añadir un producto que quedaría bajo su costo también se rechaza al editar.
    expect((await request(app).patch(`${URL}/${body.data.id}`).set(auth).send({ productoIds: [caro.id, conCosto.id] })).status).toBe(422)
  })

  it('409 si comparte productos y fechas con otra oferta no vencida (también pausada)', async () => {
    const primera = await crear({ titulo: `${TITULO} primera`, productoIds: [otro.id] })
    await request(app).patch(`${URL}/${primera.body.data.id}/pausa`).set(auth).send({ pausada: true })
    const choque = await crear({ inicio: sumarDias(HOY, 5), fin: sumarDias(HOY, 20), productoIds: [medioCentavo.id, otro.id] })
    expect(choque.status).toBe(409)
    expect(choque.body.error.message).toBe(`1 producto(s) ya están en "${TITULO} primera" en esas fechas.`)
    // Fechas que no se cruzan, o una oferta vencida, no chocan.
    expect((await crear({ inicio: sumarDias(HOY, 11), fin: sumarDias(HOY, 20), productoIds: [otro.id] })).status).toBe(201)
    await insertar(medioCentavo.id, { inicio: sumarDias(HOY, -10), fin: sumarDias(HOY, -1) })
    expect((await crear({ productoIds: [medioCentavo.id] })).status).toBe(201)
  })

  it('editar no choca consigo misma', async () => {
    const { body } = await crear({ productoIds: [otro.id] })
    const res = await request(app).patch(`${URL}/${body.data.id}`).set(auth).send({ fin: sumarDias(HOY, 30) })
    expect(res.status).toBe(200)
  })

  it('concurrencia: dos altas simultáneas sobre el mismo producto → una 201 y otra 409', async () => {
    const [a, b] = await Promise.all([
      crear({ titulo: `${TITULO} A`, productoIds: [otro.id] }),
      crear({ titulo: `${TITULO} B`, productoIds: [otro.id] }),
    ])
    expect([a.status, b.status].sort()).toEqual([201, 409])
    expect(await prisma.ofertaProducto.count({ where: { productoId: otro.id } })).toBe(1)
  })
})

describe('Precio efectivo: el mismo en admin, tienda y carrito', () => {
  const tienda = (id: number) => request(app).get(`/api/v1/tienda/productos/${id}`)
  const carrito = (id: number) => request(app).post('/api/v1/tienda/carrito/validar').send({ lineas: [{ productoId: id, cantidad: 2 }] })

  it('una oferta vigente da el mismo precio en los tres puntos; precioAnterior = base', async () => {
    const { body } = await crear({ productoIds: [medioCentavo.id] })
    const admin = body.data.productos[0].precioOferta as string
    expect(admin).toBe('9.05')

    const publico = (await tienda(medioCentavo.id)).body.data
    expect(publico).toMatchObject({ precio: admin, precioAnterior: '10.05' })

    const linea = (await carrito(medioCentavo.id)).body.data.lineas[0]
    expect(linea).toMatchObject({ precioUnitario: admin, subtotal: '18.10' })

    // Listado y relacionados usan el mismo cálculo.
    const listado = await request(app).get(`/api/v1/tienda/productos?categoria=${PREFIJO}-cat&limit=100`)
    expect(listado.body.data.find((p: { id: number }) => p.id === medioCentavo.id)).toMatchObject({ precio: admin, precioAnterior: '10.05' })
    const rel = await request(app).get(`/api/v1/tienda/productos/${otro.id}/relacionados?limit=12`)
    expect(rel.body.data.find((p: { id: number }) => p.id === medioCentavo.id)).toMatchObject({ precio: admin })
  })

  it('programada, pausada o vencida no aplican: rige el precio base y el anterior manual', async () => {
    const casos = [
      () => insertar(otro.id, { inicio: sumarDias(HOY, 1), fin: sumarDias(HOY, 5) }),
      () => insertar(otro.id, { inicio: HOY, fin: HOY, pausada: true }),
      () => insertar(otro.id, { inicio: sumarDias(HOY, -5), fin: sumarDias(HOY, -1) }),
    ]
    for (const crearCaso of casos) {
      await limpiarOfertas()
      await crearCaso()
      expect((await tienda(otro.id)).body.data).toMatchObject({ precio: '20.00', precioAnterior: '25.00' })
      expect((await carrito(otro.id)).body.data.lineas[0].precioUnitario).toBe('20.00')
    }
  })

  it('fechas inclusive: la oferta rige el día de inicio y el día de fin', async () => {
    await insertar(otro.id, { inicio: HOY, fin: HOY, valor: '50' })
    expect((await tienda(otro.id)).body.data).toMatchObject({ precio: '10.00', precioAnterior: '20.00' })
  })

  it('pausar devuelve el precio base al instante', async () => {
    const { body } = await crear({ productoIds: [otro.id] })
    expect((await tienda(otro.id)).body.data.precio).toBe('18.00')
    await request(app).patch(`${URL}/${body.data.id}/pausa`).set(auth).send({ pausada: true })
    expect((await tienda(otro.id)).body.data.precio).toBe('20.00')
  })

  it('el filtro de ofertas y los órdenes por precio y descuento usan el precio efectivo', async () => {
    // conCosto: 113.00 → 101.70 con 10 % (ahorro 11.30, sin precio anterior manual).
    await crear({ productoIds: [conCosto.id] })
    const listar = async (query: string) =>
      ((await request(app).get(`/api/v1/tienda/productos?categoria=${PREFIJO}-cat&limit=100&${query}`)).body.data as { id: number; precio: string }[])
    const ofertas = (await listar('ofertas=true')).map((p) => p.id)
    expect(ofertas).toContain(conCosto.id)
    expect(ofertas).toContain(otro.id) // precio anterior manual
    expect(ofertas).not.toContain(medioCentavo.id)
    expect((await listar('orden=descuento'))[0]?.id).toBe(conCosto.id)
    const precios = (await listar('orden=precio-asc')).map((p) => Number(p.precio))
    expect(precios).toEqual([...precios].sort((a, b) => a - b))
  })

  it('el admin de productos sigue con el precio base: guardar no convierte el de oferta en base', async () => {
    await crear({ productoIds: [conCosto.id] })
    const ficha = await request(app).get(`/api/v1/admin/productos/${conCosto.id}`).set(auth)
    expect(ficha.body.data).toMatchObject({ precio: '113.00', precioAnterior: null })
    const guardado = await request(app).patch(`/api/v1/admin/productos/${conCosto.id}`).set(auth).send({ nombre: 'Prueba L12 con costo', precio: ficha.body.data.precio })
    expect(guardado.status).toBe(200)
    expect(guardado.body.data.precio).toBe('113.00')
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: conCosto.id } })).precio.toFixed(2)).toBe('113.00')
    expect((await tienda(conCosto.id)).body.data.precio).toBe('101.70')
  })
})
