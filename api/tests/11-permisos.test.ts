import type { Express } from 'express'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearApp } from '../src/01-app.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { ACCIONES, MARCA_PERMISO, VISTAS, type Permiso } from '../src/05-pipeline-acceso/00-director-acceso.js'
import { bearer, crearUsuarioConPermisos, crearUsuarioHabilitado, eliminarUsuario, fijarPermisos, identidadFalsa } from './05-sesion-prueba.js'
import { crearImagenesFalsas } from './07-imagenes-prueba.js'

/**
 * L09 · Matriz de permisos: cada ruta /admin con un usuario que tiene solo el permiso (no 403)
 * y otro al que le falta (403 PERMISSION_DENIED). Las peticiones usan ids o cuerpos inválidos:
 * el permiso se evalúa antes que la validación, así que nada se escribe.
 */
const UID = 'prueba-l09-rbac'
const UID_SUPER = 'prueba-l09-rbac-super'
const app = crearApp({ pingBD: async () => {}, identidad: identidadFalsa, imagenes: crearImagenesFalsas().proveedor, origenes: [] })
const auth = { Authorization: bearer(UID) }

type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete'
interface Fila {
  metodo: Metodo
  /** Ruta tal como se registra en Express (bajo /api/v1/admin). */
  patron: string
  /** Ruta concreta que se pide. */
  url: string
  /** Alternativas aceptadas (cualquiera basta). */
  permisos: Permiso[]
}

const SESION_EXENTAS = ['GET /sesion', 'POST /sesion', 'PUT /sesion/contrasena']

const MATRIZ: Fila[] = [
  { metodo: 'get', patron: '/categorias', url: '/categorias', permisos: ['categorias', 'productos'] },
  { metodo: 'get', patron: '/categorias/:slug', url: '/categorias/no-existe', permisos: ['categorias', 'productos'] },
  { metodo: 'post', patron: '/categorias', url: '/categorias', permisos: ['categorias.gestionar'] },
  { metodo: 'patch', patron: '/categorias/:slug', url: '/categorias/no-existe', permisos: ['categorias.gestionar'] },
  { metodo: 'delete', patron: '/categorias/:slug', url: '/categorias/no-existe', permisos: ['categorias.gestionar'] },
  { metodo: 'get', patron: '/marcas', url: '/marcas', permisos: ['categorias', 'productos'] },
  { metodo: 'get', patron: '/marcas/:slug', url: '/marcas/no-existe', permisos: ['categorias', 'productos'] },
  { metodo: 'post', patron: '/marcas', url: '/marcas', permisos: ['categorias.gestionar'] },
  { metodo: 'patch', patron: '/marcas/:slug/activa', url: '/marcas/no-existe/activa', permisos: ['categorias.gestionar'] },
  { metodo: 'patch', patron: '/marcas/:slug', url: '/marcas/no-existe', permisos: ['categorias.gestionar'] },
  { metodo: 'delete', patron: '/marcas/:slug', url: '/marcas/no-existe', permisos: ['categorias.gestionar'] },
  { metodo: 'get', patron: '/productos', url: '/productos', permisos: ['productos', 'tablero'] },
  { metodo: 'get', patron: '/productos/:id', url: '/productos/999999', permisos: ['productos', 'tablero'] },
  { metodo: 'post', patron: '/productos', url: '/productos', permisos: ['productos.crear'] },
  { metodo: 'patch', patron: '/productos/:id/publicado', url: '/productos/999999/publicado', permisos: ['productos.visibilidad'] },
  { metodo: 'patch', patron: '/productos/:id', url: '/productos/999999', permisos: ['productos.editar'] },
  { metodo: 'delete', patron: '/productos/:id', url: '/productos/999999', permisos: ['productos.eliminar'] },
  { metodo: 'post', patron: '/imagenes', url: '/imagenes', permisos: ['productos.crear', 'productos.editar'] },
  { metodo: 'delete', patron: '/imagenes/:id', url: '/imagenes/999999', permisos: ['productos.crear', 'productos.editar'] },
  { metodo: 'get', patron: '/inventario/metricas', url: '/inventario/metricas', permisos: ['productos', 'tablero'] },
  { metodo: 'post', patron: '/productos/:id/ajustes', url: '/productos/999999/ajustes', permisos: ['productos.existencias'] },
  { metodo: 'put', patron: '/productos/:id/existencias', url: '/productos/999999/existencias', permisos: ['productos.editar'] },
  { metodo: 'get', patron: '/usuarios', url: '/usuarios', permisos: ['ajustes'] },
  { metodo: 'post', patron: '/usuarios', url: '/usuarios', permisos: ['ajustes.usuarios'] },
  { metodo: 'patch', patron: '/usuarios/:id', url: '/usuarios/999999', permisos: ['ajustes.usuarios'] },
  { metodo: 'put', patron: '/usuarios/:id/accesos', url: '/usuarios/999999/accesos', permisos: ['ajustes.usuarios'] },
  { metodo: 'put', patron: '/usuarios/:id/contrasena', url: '/usuarios/999999/contrasena', permisos: ['ajustes.usuarios'] },
  { metodo: 'delete', patron: '/usuarios/:id', url: '/usuarios/999999', permisos: ['ajustes.usuarios'] },
  // L10: el emisor lo leen las vistas que lo muestran o imprimen; guardarlo exige editar la configuración.
  { metodo: 'get', patron: '/ajustes/identidad', url: '/ajustes/identidad', permisos: ['ajustes', 'tablero', 'facturacion', 'cotizaciones'] },
  { metodo: 'put', patron: '/ajustes/identidad', url: '/ajustes/identidad', permisos: ['ajustes.configuracion'] },
]

const TODAS: Permiso[] = [...VISTAS, ...ACCIONES]
const vistaDe = (p: Permiso) => p.split('.')[0] as Permiso

/** Lo mínimo para tener el permiso: la clave y, si es una acción, su vista. */
const soloCon = (p: Permiso): Permiso[] => [...new Set([vistaDe(p), p])]
/** Todo menos las alternativas (si una es vista, sus acciones dejan de contar por normalización). */
const todoMenos = (alternativas: Permiso[]): Permiso[] => TODAS.filter((p) => !alternativas.includes(p))

const pedir = (fila: Pick<Fila, 'metodo' | 'url'>) => request(app)[fila.metodo](`/api/v1/admin${fila.url}`).set(auth)

interface CapaExpress {
  route?: { path: string; methods: Record<string, boolean>; stack: { handle: object }[] }
  handle: { stack?: CapaExpress[] } & object
  match: (ruta: string) => boolean
}

/** Rutas registradas bajo /api/v1/admin, con si llevan `requierePermiso`. */
function rutasAdmin(aplicacion: Express): { clave: string; protegida: boolean }[] {
  const raiz = (aplicacion as unknown as { router: { stack: CapaExpress[] } }).router.stack
  const montaje = raiz.find((capa) => capa.handle.stack && capa.match('/api/v1/admin/x'))
  if (!montaje?.handle.stack) throw new Error('No se encontró el router /api/v1/admin')
  const rutas: { clave: string; protegida: boolean }[] = []
  const recorrer = (pila: CapaExpress[]) => {
    for (const capa of pila) {
      if (capa.route) {
        const protegida = capa.route.stack.some((s) => MARCA_PERMISO in s.handle)
        for (const metodo of Object.keys(capa.route.methods)) rutas.push({ clave: `${metodo.toUpperCase()} ${capa.route.path}`, protegida })
      } else if (capa.handle.stack) {
        recorrer(capa.handle.stack)
      }
    }
  }
  recorrer(montaje.handle.stack)
  return rutas
}

let usuarioId: number

beforeAll(async () => {
  usuarioId = (await crearUsuarioConPermisos(UID, [])).id
  await crearUsuarioHabilitado(UID_SUPER)
})

afterAll(async () => {
  await eliminarUsuario(UID)
  await eliminarUsuario(UID_SUPER)
  await desconectarBD()
})

describe('RBAC: cobertura', () => {
  it('toda ruta /admin lleva requierePermiso, salvo las de la propia sesión', () => {
    const sinPermiso = rutasAdmin(app).filter((r) => !r.protegida).map((r) => r.clave)
    expect(sinPermiso.sort()).toEqual([...SESION_EXENTAS].sort())
  })

  it('la matriz de pruebas cubre todas las rutas protegidas', () => {
    const protegidas = rutasAdmin(app).filter((r) => r.protegida).map((r) => r.clave)
    const enMatriz = MATRIZ.map((f) => `${f.metodo.toUpperCase()} ${f.patron}`)
    expect(enMatriz.sort()).toEqual(protegidas.sort())
  })
})

describe('RBAC: matriz permitido / denegado', () => {
  for (const fila of MATRIZ) {
    describe(`${fila.metodo.toUpperCase()} ${fila.patron}`, () => {
      for (const permiso of fila.permisos) {
        it(`permitido con «${permiso}»`, async () => {
          await fijarPermisos(usuarioId, soloCon(permiso))
          const res = await pedir(fila)
          expect(res.status).not.toBe(403)
          expect(res.status).not.toBe(401)
        })
      }
      it(`denegado sin ${fila.permisos.map((p) => `«${p}»`).join(' ni ')}`, async () => {
        await fijarPermisos(usuarioId, todoMenos(fila.permisos))
        const res = await pedir(fila)
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe('PERMISSION_DENIED')
      })
    })
  }
})

describe('RBAC: reglas', () => {
  it('los permisos se leen de la BD en cada petición (sin caché)', async () => {
    await fijarPermisos(usuarioId, ['productos'])
    expect((await pedir({ metodo: 'get', url: '/productos' })).status).toBe(200)
    await fijarPermisos(usuarioId, ['clientes'])
    expect((await pedir({ metodo: 'get', url: '/productos' })).status).toBe(403)
  })

  it('una acción sin su vista no cuenta', async () => {
    await fijarPermisos(usuarioId, ['productos.existencias'])
    const res = await pedir({ metodo: 'post', url: '/productos/999999/ajustes' })
    expect(res.status).toBe(403)
  })

  it('el 403 por permiso no se confunde con el de cuenta deshabilitada', async () => {
    await fijarPermisos(usuarioId, ['clientes'])
    const res = await pedir({ metodo: 'get', url: '/productos' })
    expect(res.body.error.code).toBe('PERMISSION_DENIED')
  })

  it('el superadmin pasa todas las rutas sin filas de permisos', async () => {
    for (const fila of MATRIZ) {
      const res = await request(app)[fila.metodo](`/api/v1/admin${fila.url}`).set({ Authorization: bearer(UID_SUPER) })
      expect(res.status, `${fila.metodo} ${fila.url}`).not.toBe(403)
    }
  })

  it('la sesión devuelve los accesos efectivos normalizados', async () => {
    await fijarPermisos(usuarioId, ['productos', 'productos.crear', 'pedidos.gestionar'])
    const res = await request(app).get('/api/v1/admin/sesion').set(auth)
    expect(res.body.data.accesos).toEqual({ vistas: ['productos'], acciones: ['productos.crear'] })
  })

  it('con contraseña temporal solo queda libre la sesión', async () => {
    await fijarPermisos(usuarioId, soloCon('productos'))
    await prisma.usuario.update({ where: { id: usuarioId }, data: { debeCambiarContrasena: true } })
    try {
      const bloqueada = await pedir({ metodo: 'get', url: '/productos' })
      expect(bloqueada.status).toBe(403)
      expect(bloqueada.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED')
      expect((await pedir({ metodo: 'get', url: '/sesion' })).status).toBe(200)
    } finally {
      await prisma.usuario.update({ where: { id: usuarioId }, data: { debeCambiarContrasena: false } })
    }
  })
})

describe('RBAC: catálogo y plantillas', () => {
  it('la tabla permisos coincide con el catálogo del código, en orden', async () => {
    const filas = await prisma.permiso.findMany({ orderBy: { orden: 'asc' } })
    const esperado = ['tablero', 'productos', ...ACCIONES.filter((a) => a.startsWith('productos.'))]
    expect(filas.map((f) => f.clave).slice(0, esperado.length)).toEqual(esperado)
    expect(new Set(filas.map((f) => f.clave))).toEqual(new Set(TODAS))
    for (const f of filas) expect(f.tipo).toBe(f.clave.includes('.') ? 'accion' : 'vista')
  })

  // Copia de ROLES (admin/src/86-pipeline-datos-demo-personas/01-roles.mock.ts), normalizada.
  const PLANTILLAS: Record<string, Permiso[]> = {
    superadmin: TODAS,
    gerencia: [
      'tablero', 'productos', 'productos.crear', 'productos.editar', 'productos.existencias', 'productos.visibilidad',
      'pedidos', 'pedidos.gestionar', 'pedidos.reservar', 'pedidos.eliminar', 'facturacion', 'facturacion.emitir',
      'clientes', 'clientes.gestionar', 'clientes.eliminar', 'categorias', 'categorias.gestionar', 'ofertas', 'ofertas.gestionar',
      'cotizaciones', 'cotizaciones.gestionar', 'interacciones', 'interacciones.moderar',
    ],
    administracion: [
      'tablero', 'productos', 'productos.crear', 'productos.editar', 'productos.eliminar', 'productos.existencias', 'productos.visibilidad',
      'pedidos', 'pedidos.gestionar', 'pedidos.reservar', 'facturacion', 'facturacion.emitir', 'clientes', 'clientes.gestionar',
      'categorias', 'categorias.gestionar', 'ofertas', 'ofertas.gestionar', 'cotizaciones', 'cotizaciones.gestionar',
      'interacciones', 'interacciones.moderar',
    ],
    caja_inventario: [
      'productos', 'productos.existencias', 'productos.visibilidad', 'pedidos', 'pedidos.gestionar', 'pedidos.reservar',
      'facturacion', 'facturacion.emitir', 'clientes', 'clientes.gestionar',
    ],
    servicio_cliente: [
      'productos', 'pedidos', 'clientes', 'clientes.gestionar', 'cotizaciones', 'cotizaciones.gestionar', 'interacciones', 'interacciones.moderar',
    ],
  }

  it('los 5 roles y sus plantillas son los del admin', async () => {
    const roles = await prisma.rol.findMany({ include: { permisos: true }, orderBy: { orden: 'asc' } })
    expect(roles.map((r) => r.id)).toEqual(Object.keys(PLANTILLAS))
    for (const rol of roles) {
      expect(new Set(rol.permisos.map((p) => p.permisoClave)), rol.id).toEqual(new Set(PLANTILLAS[rol.id]))
    }
  })
})
