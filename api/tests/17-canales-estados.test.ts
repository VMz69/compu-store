import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L13 · Ajustes › Canales y flujo: CRUD de canales de venta (43) con nombre único y 409 al eliminar
 * uno con pedidos, y las etiquetas de los estados (lo único configurable del flujo). Los canales de
 * la suite se llaman «Prueba L13C…»; las etiquetas se restauran al terminar.
 */
const UID = 'prueba-l13c'
const CANAL = 'Prueba L13C'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const CANALES = '/api/v1/admin/canales-venta'
const ESTADOS = '/api/v1/admin/estados-pedido'

let etiquetasOriginales: { estado: string; nombre: string; descripcion: string }[] = []

async function limpiar() {
  await prisma.pedido.deleteMany({ where: { canal: { nombre: { startsWith: CANAL } } } })
  await prisma.canalVenta.deleteMany({ where: { nombre: { startsWith: CANAL } } })
}

const crear = (cuerpo: Record<string, unknown>) =>
  request(app)
    .post(CANALES)
    .set(auth)
    .send({ icono: 'fa-solid fa-store', ...cuerpo })

beforeAll(async () => {
  await limpiar()
  await crearUsuarioHabilitado(UID)
  etiquetasOriginales = await prisma.etiquetaEstadoPedido.findMany()
})

afterAll(async () => {
  await limpiar()
  for (const { estado, nombre, descripcion } of etiquetasOriginales) {
    await prisma.etiquetaEstadoPedido.update({ where: { estado: estado as 'registrado' }, data: { nombre, descripcion } })
  }
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('Canales de venta', () => {
  it('crea con valores por defecto, lista, edita y activa/desactiva', async () => {
    const res = await crear({ nombre: `  ${CANAL} Feria  `, descripcion: 'Ventas en ferias' })

    expect(res.status).toBe(201)
    expect(res.body.data).toEqual({
      id: expect.any(Number),
      nombre: `${CANAL} Feria`,
      insignia: 'Canal',
      icono: 'fa-solid fa-store',
      color: 'blue',
      descripcion: 'Ventas en ferias',
      activo: true,
      totalPedidos: 0,
    })
    const id = res.body.data.id as number

    const lista = await request(app).get(CANALES).set(auth)
    expect(lista.body.data.some((c: { id: number }) => c.id === id)).toBe(true)

    const editado = await request(app).patch(`${CANALES}/${id}`).set(auth).send({ insignia: 'Eventos', activo: false })
    expect(editado.status).toBe(200)
    expect(editado.body.data).toMatchObject({ nombre: `${CANAL} Feria`, insignia: 'Eventos', activo: false })
  })

  it('valida el cuerpo (400): nombre corto o largo, campos desconocidos y color no editable', async () => {
    expect((await crear({ nombre: 'ab' })).status).toBe(400)
    expect((await crear({ nombre: 'x'.repeat(41) })).status).toBe(400)
    expect((await crear({ nombre: `${CANAL} Color`, color: 'red' })).status).toBe(400)
    expect((await crear({ nombre: `${CANAL} Desc`, descripcion: 'x'.repeat(161) })).status).toBe(400)
  })

  it('409 con un nombre repetido sin distinguir acentos ni mayúsculas, también al renombrar', async () => {
    expect((await crear({ nombre: `${CANAL} Teléfono` })).status).toBe(201)
    expect((await crear({ nombre: `${CANAL} TELEFONO` })).status).toBe(409)
    const otro = await crear({ nombre: `${CANAL} Correo` })
    const res = await request(app).patch(`${CANALES}/${otro.body.data.id}`).set(auth).send({ nombre: `${CANAL} telefono` })
    expect(res.status).toBe(409)
    expect(res.body.error.message).toBe('Ya existe un canal con ese nombre.')
  })

  it('elimina un canal sin pedidos (204) y responde 409 si tiene pedidos, aunque estén eliminados', async () => {
    const libre = await crear({ nombre: `${CANAL} Libre` })
    expect((await request(app).delete(`${CANALES}/${libre.body.data.id}`).set(auth)).status).toBe(204)
    expect((await request(app).delete(`${CANALES}/${libre.body.data.id}`).set(auth)).status).toBe(404)

    const usado = await crear({ nombre: `${CANAL} Usado` })
    await prisma.pedido.create({
      data: {
        clienteNombre: 'Visitante',
        clienteTelefono: '7000-0000',
        clienteCorreo: '',
        ciudad: '',
        canalId: usado.body.data.id,
        canalNombre: `${CANAL} Usado`,
        formaPago: 'Efectivo',
        formaEntrega: 'Retiro',
        notas: '',
        total: '0.00',
        eliminadoEn: new Date(),
      },
    })
    const res = await request(app).delete(`${CANALES}/${usado.body.data.id}`).set(auth)
    expect(res.status).toBe(409)
    expect(res.body.error.message).toBe('Tiene 1 pedido(s). Desactívalo para que no se use en pedidos nuevos.')
  })
})

describe('Etiquetas de estado', () => {
  it('lista los 5 estados en el orden del flujo con los textos de fábrica', async () => {
    const res = await request(app).get(ESTADOS).set(auth)

    expect(res.status).toBe(200)
    expect(res.body.data.map((e: { estado: string }) => e.estado)).toEqual(['registrado', 'confirmado', 'facturado', 'entregado', 'cancelado'])
    expect(res.body.data[1]).toMatchObject({ estado: 'confirmado', nombre: 'Reservado' })
  })

  it('cambia el nombre y la descripción (normalizados)', async () => {
    const res = await request(app).put(`${ESTADOS}/cancelado`).set(auth).send({ nombre: ' Anulado ', descripcion: 'Pedido anulado.' })

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ estado: 'cancelado', nombre: 'Anulado', descripcion: 'Pedido anulado.' })
  })

  it('409 si otro estado ya usa el nombre (sin mayúsculas ni acentos) y 400 con datos inválidos', async () => {
    const repetido = await request(app).put(`${ESTADOS}/registrado`).set(auth).send({ nombre: 'RESERVADO' })
    expect(repetido.status).toBe(409)
    expect(repetido.body.error.message).toBe('Otro estado ya usa ese nombre.')
    // El propio nombre se puede volver a guardar.
    expect((await request(app).put(`${ESTADOS}/confirmado`).set(auth).send({ nombre: 'Reservado' })).status).toBe(200)

    expect((await request(app).put(`${ESTADOS}/otro`).set(auth).send({ nombre: 'Otro estado' })).status).toBe(400)
    expect((await request(app).put(`${ESTADOS}/registrado`).set(auth).send({ nombre: 'ab' })).status).toBe(400)
    expect((await request(app).put(`${ESTADOS}/registrado`).set(auth).send({ nombre: 'Registrado', paso: 3 })).status).toBe(400)
  })
})
