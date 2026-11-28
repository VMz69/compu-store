import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { ProveedorIdentidad, ProveedorImagenes } from './03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp, manejarErrores, noEncontrado } from './04-pipeline-http/00-director-http.js'
import { autenticar, contrasenaVigente, crearRouterSesion, crearRouterUsuarios } from './05-pipeline-acceso/00-director-acceso.js'
import {
  crearRouterAdminProductos,
  crearRouterAdminTaxonomia,
  crearRouterTiendaProductos,
  crearRouterTiendaTaxonomia,
} from './06-pipeline-catalogo/00-director-catalogo.js'
import { crearRouterAdminInventario } from './07-pipeline-inventario/00-director-inventario.js'
import { crearRouterAjustes, crearRouterTienda } from './08-pipeline-tienda/00-director-tienda.js'
import { crearRouterClientes } from './09-pipeline-clientes/00-director-clientes.js'
import { crearRouterAdminOfertas } from './10-pipeline-ofertas/00-director-ofertas.js'
import { conectarReservas, crearRouterAjustesVentas, crearRouterPedidos } from './11-pipeline-pedidos/00-director-pedidos.js'
import { crearRouterFacturas } from './12-pipeline-facturacion/00-director-facturacion.js'
import { crearRouterCotizaciones } from './13-pipeline-cotizaciones/00-director-cotizaciones.js'
import { crearRouterResenas, crearRouterTiendaResenas } from './14-pipeline-resenas/00-director-resenas.js'
import { crearRouterReportes } from './15-pipeline-reportes/00-director-reportes.js'

export interface DependenciasApp {
  /** Comprueba la base de datos; se inyecta para poder simular fallos en las pruebas. */
  pingBD: () => Promise<void>
  /** Proveedor de identidad (Firebase); las pruebas inyectan uno falso. */
  identidad: ProveedorIdentidad
  /** Almacén de imágenes (Cloudinary, D-17); las pruebas inyectan uno falso. */
  imagenes: ProveedorImagenes
  /** Orígenes permitidos por CORS. */
  origenes: string[]
  /** Rutas adicionales montadas antes del 404 (solo para pruebas). */
  extender?: (app: Express) => void
}

/** Construye la aplicación Express sin abrir puertos (lo hace 00-main). */
export function crearApp({ pingBD, identidad, imagenes, origenes, extender }: DependenciasApp): Express {
  // Inventario vence las reservas caducadas antes de calcular el disponible (D-07, L14).
  conectarReservas()
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // Railway y Vercel están detrás de un proxy.

  app.use(helmet())
  app.use(cors({ origin: origenes }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/v1/health', async (_req, res) => {
    try {
      await pingBD()
    } catch {
      throw new ErrorApp('SERVICE_UNAVAILABLE', 503, 'La base de datos no responde.')
    }
    res.json({ data: { estado: 'ok', baseDatos: 'ok', fecha: new Date().toISOString() } })
  })

  // /api/v1/admin/* está protegido por defecto (401 sin token, 403 sin Usuario activo),
  // incluidas las rutas inexistentes, que solo dan 404 a un usuario habilitado.
  const admin = express.Router()
  admin.use(autenticar(identidad))
  admin.use(crearRouterSesion(identidad))
  // L09: con contraseña temporal solo queda libre la sesión; cada ruta siguiente exige su permiso.
  admin.use(contrasenaVigente)
  admin.use(crearRouterAdminTaxonomia())
  admin.use(crearRouterAdminProductos(imagenes))
  admin.use(crearRouterAdminInventario())
  admin.use(crearRouterUsuarios(identidad))
  admin.use(crearRouterAjustes())
  admin.use(crearRouterClientes())
  admin.use(crearRouterAdminOfertas())
  admin.use(crearRouterAjustesVentas())
  admin.use(crearRouterPedidos())
  admin.use(crearRouterFacturas())
  admin.use(crearRouterCotizaciones())
  admin.use(crearRouterResenas())
  admin.use(crearRouterReportes())
  app.use('/api/v1/admin', admin)

  // /api/v1/tienda/* es público y de solo lectura.
  app.use('/api/v1/tienda', crearRouterTiendaTaxonomia(), crearRouterTiendaProductos(), crearRouterTienda(), crearRouterTiendaResenas())

  extender?.(app)

  app.use(noEncontrado)
  app.use(manejarErrores)
  return app
}
