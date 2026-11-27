import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { bearer, crearUsuarioHabilitado, eliminarUsuario, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/** L10 · Ajustes › Identidad del emisor: lectura, guardado y reflejo en la identidad pública. */
const UID = 'prueba-l10'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }
const URL = '/api/v1/admin/ajustes/identidad'

const VALIDO = {
  nombre: '  CompuStore Prueba  ',
  correo: 'Ventas@Prueba.COM',
  telefonos: ['7777-1234', '2222-3333'],
  direccion: 'Calle de prueba 123, Cojutepeque, Cuscatlán.',
  emisor: {
    razonSocial: 'compu prueba sa de cv',
    nit: '0614-250318-102-3',
    nrc: '123456-7',
    actividadEconomica: 'Venta de equipo de prueba',
    tipoEstablecimiento: 'Sucursal / Agencia',
  },
  /** Mayor que el último correlativo (L15): se fija en `beforeAll`, porque la BD de pruebas acumula facturas. */
  semillaFactura: 15800,
}
let ultimoCorrelativo = 0

let original: Awaited<ReturnType<typeof prisma.configuracionTienda.findUniqueOrThrow>>

beforeAll(async () => {
  await sembrar(prisma) // garantiza la fila id = 1 (idempotente)
  original = await prisma.configuracionTienda.findUniqueOrThrow({ where: { id: 1 } })
  ultimoCorrelativo = (await prisma.correlativo.findUniqueOrThrow({ where: { clave: 'factura-interno' } })).ultimo
  VALIDO.semillaFactura = ultimoCorrelativo + 19
  await crearUsuarioHabilitado(UID)
})

afterAll(async () => {
  // Deja la configuración como estaba para el resto de suites.
  const { id: _id, actualizadaEn: _a, telefonos, valores, redes, ...resto } = original
  await prisma.configuracionTienda.update({
    where: { id: 1 },
    data: { ...resto, telefonos: telefonos ?? [], valores: valores ?? [], redes: redes ?? {} },
  })
  await eliminarUsuario(UID)
  await desconectarBD()
})

describe('GET /admin/ajustes/identidad', () => {
  it('devuelve identidad, emisor y semilla', async () => {
    const res = await request(app).get(URL).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      nombre: original.nombre,
      emisor: { razonSocial: original.razonSocial, nit: original.nit, nrc: original.nrc, tipoEstablecimiento: original.tipoEstablecimiento },
      semillaFactura: original.semillaFactura,
    })
    expect(res.body.data.moneda).toBeDefined()
  })

  it('401 sin token', async () => {
    expect((await request(app).get(URL)).status).toBe(401)
  })
})

describe('PUT /admin/ajustes/identidad', () => {
  it('guarda normalizando y deriva WhatsApp en el servidor', async () => {
    const res = await request(app).put(URL).set(auth).send(VALIDO)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      nombre: 'CompuStore Prueba',
      correo: 'ventas@prueba.com',
      telefonos: ['7777-1234', '2222-3333'],
      whatsapp: '50377771234',
      direccion: VALIDO.direccion,
      emisor: { ...VALIDO.emisor, razonSocial: 'COMPU PRUEBA SA DE CV' },
      semillaFactura: VALIDO.semillaFactura,
    })
    expect(res.body.data.redes.whatsapp).toBe('https://wa.me/50377771234')
    // Lo que el admin no edita se conserva.
    expect(res.body.data.eslogan).toBe(original.eslogan)
    expect(res.body.data.redes.facebook).toBe((original.redes as Record<string, string>).facebook)
  })

  it('el cambio se refleja en la identidad pública, sin exponer el emisor', async () => {
    const res = await request(app).get('/api/v1/tienda/identidad')
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ nombre: 'CompuStore Prueba', telefonos: ['7777-1234', '2222-3333'], whatsapp: '50377771234' })
    expect(res.body.data).not.toHaveProperty('emisor')
    expect(res.body.data).not.toHaveProperty('semillaFactura')
  })

  it('L15: la semilla solo adelanta la numeración (≤ último correlativo → 422)', async () => {
    for (const semilla of [ultimoCorrelativo, ultimoCorrelativo - 1]) {
      const res = await request(app).put(URL).set(auth).send({ ...VALIDO, semillaFactura: semilla })
      expect(res.status).toBe(422)
      expect(res.body.error.message).toBe(`Debe ser mayor que el último emitido (${String(ultimoCorrelativo).padStart(6, '0')}).`)
      expect(res.body.error.details).toEqual([{ campo: 'semillaFactura', mensaje: res.body.error.message }])
    }
  })

  it('semilla null = continuar la secuencia; un solo teléfono es válido', async () => {
    const res = await request(app).put(URL).set(auth).send({ ...VALIDO, telefonos: ['70388225'], semillaFactura: null })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ telefonos: ['70388225'], whatsapp: '50370388225', semillaFactura: null })
  })

  it.each([
    ['nombre corto', { nombre: 'ab' }],
    ['correo inválido', { correo: 'no-es-correo' }],
    ['sin teléfonos', { telefonos: [] }],
    ['teléfono inválido', { telefonos: ['abc'] }],
    ['tres teléfonos', { telefonos: ['7777-1234', '7777-1235', '7777-1236'] }],
    ['dirección corta', { direccion: 'corta' }],
    ['NIT de 10 dígitos', { emisor: { ...VALIDO.emisor, nit: '0614250318' } }],
    ['NRC sin verificador', { emisor: { ...VALIDO.emisor, nrc: '1234567' } }],
    ['tipo de establecimiento fuera del catálogo', { emisor: { ...VALIDO.emisor, tipoEstablecimiento: 'Kiosco' } }],
    ['giro corto', { emisor: { ...VALIDO.emisor, actividadEconomica: 'abc' } }],
    ['semilla 0', { semillaFactura: 0 }],
    ['semilla de 7 dígitos', { semillaFactura: 1_000_000 }],
    ['semilla decimal', { semillaFactura: 12.5 }],
  ])('400 con %s', async (_caso, cambio) => {
    const res = await request(app).put(URL).set(auth).send({ ...VALIDO, ...cambio })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it.each([
    ['whatsapp', { whatsapp: '50300000000' }],
    ['IVA', { iva: '15.00' }],
    ['redes', { redes: { facebook: 'https://evil.example' } }],
    ['campo extra del emisor', { emisor: { ...VALIDO.emisor, sello: 'x' } }],
  ])('400 si el navegador envía %s', async (_caso, extra) => {
    const res = await request(app).put(URL).set(auth).send({ ...VALIDO, ...extra })
    expect(res.status).toBe(400)
  })
})
