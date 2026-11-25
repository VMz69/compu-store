import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, pingBD } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { validar } from '../src/04-pipeline-http/00-director-http.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

const origenes = ['http://localhost:5173']
const imagenes = crearImagenesFalsas().proveedor
/** Estas pruebas no autentican: cualquier token se rechaza. */
const identidad = {
  verificarToken: async () => {
    throw new Error('sin proveedor')
  },
  actualizarContrasena: async () => {},
  buscarPorCorreo: async () => null,
}

describe('GET /api/v1/health', () => {
  afterAll(async () => {
    await desconectarBD()
  })

  it('responde 200 cuando la BD de pruebas está disponible', async () => {
    const res = await request(crearApp({ pingBD, identidad, imagenes, origenes })).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ estado: 'ok', baseDatos: 'ok' })
    expect(new Date(res.body.data.fecha).toISOString()).toBe(res.body.data.fecha)
  })

  it('responde 503 con el sobre de error si la BD no responde', async () => {
    const pingFallido = async () => {
      throw new Error('sin conexión')
    }
    const res = await request(crearApp({ pingBD: pingFallido, identidad, imagenes, origenes })).get('/api/v1/health')

    expect(res.status).toBe(503)
    expect(res.body).toEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: 'La base de datos no responde.' } })
  })
})

describe('Errores y validación', () => {
  const app = crearApp({
    pingBD: async () => {},
    identidad,
    imagenes,
    origenes,
    extender: (a) =>
      a.post('/prueba', validar({ body: z.object({ cantidad: z.number().int().min(1) }) }), (req, res) => {
        res.status(201).json({ data: req.body })
      }),
  })

  it('responde 404 NOT_FOUND en rutas inexistentes', async () => {
    const res = await request(app).get('/api/v1/no-existe')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('responde 400 VALIDATION_ERROR con detalles cuando el cuerpo es inválido', async () => {
    const res = await request(app).post('/prueba').send({ cantidad: 0 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toEqual([expect.objectContaining({ campo: 'cantidad' })])
  })

  it('responde 400 VALIDATION_ERROR cuando el JSON está mal formado', async () => {
    const res = await request(app).post('/prueba').set('Content-Type', 'application/json').send('{"cantidad":')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('acepta un cuerpo válido', async () => {
    const res = await request(app).post('/prueba').send({ cantidad: 2 })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ data: { cantidad: 2 } })
  })
})
