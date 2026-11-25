import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { env } from '../02-env.js'

/** Imagen almacenada en el proveedor: URL pública (https) e identificador para destruirla. */
export interface ImagenAlmacenada {
  url: string
  publicId: string
}

/**
 * Operaciones del almacén de imágenes que usa la API (D-17). Se inyecta en `crearApp`
 * para que las pruebas usen un proveedor falso sin credenciales ni red.
 */
export interface ProveedorImagenes {
  /** false si faltan credenciales: la subida responde 503 sin intentar conectarse. */
  disponible: () => boolean
  /** Sube el binario (ya validado) y devuelve su URL y publicId. */
  subir: (contenido: Buffer) => Promise<ImagenAlmacenada>
  /** Destruye las imágenes; las que ya no existen cuentan como eliminadas. Lanza si el proveedor falla. */
  eliminar: (publicIds: string[]) => Promise<void>
}

const VARIABLES_CLOUDINARY = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const

/** Carpeta de Cloudinary donde se guardan las imágenes de productos. */
const CARPETA = 'compustore/productos'

const faltantes = () => VARIABLES_CLOUDINARY.filter((clave) => !env[clave])

/** Lanza un error que nombra las variables de Cloudinary que faltan (nunca sus valores). */
export function comprobarConfiguracionCloudinary(): void {
  const ausentes = faltantes()
  if (ausentes.length > 0) {
    throw new Error(`Faltan variables de Cloudinary: ${ausentes.join(', ')} (ver api/README.md).`)
  }
}

let configurado = false

/** Configuración perezosa: nada se conecta hasta la primera operación. */
function cliente(): typeof cloudinary {
  if (configurado) return cloudinary
  comprobarConfiguracionCloudinary()
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
    secure: true,
  })
  configurado = true
  return cloudinary
}

/** Proveedor real sobre el SDK de Cloudinary (Upload API: no consume la cuota de la Admin API). */
export const proveedorCloudinary: ProveedorImagenes = {
  disponible: () => faltantes().length === 0,

  subir: (contenido) =>
    new Promise((resolver, rechazar) => {
      const flujo = cliente().uploader.upload_stream(
        { folder: CARPETA, resource_type: 'image', overwrite: false },
        (error, resultado?: UploadApiResponse) => {
          if (error || !resultado) {
            rechazar(new Error(`Cloudinary rechazó la subida: ${error?.message ?? 'sin respuesta'}`))
            return
          }
          resolver({ url: resultado.secure_url, publicId: resultado.public_id })
        },
      )
      flujo.end(contenido)
    }),

  async eliminar(publicIds) {
    const api = cliente().uploader
    await Promise.all(
      publicIds.map(async (publicId) => {
        const { result } = (await api.destroy(publicId, { resource_type: 'image', invalidate: true })) as { result?: string }
        if (result !== 'ok' && result !== 'not found') throw new Error(`Cloudinary no eliminó la imagen (${result ?? 'sin respuesta'}).`)
      }),
    )
  },
}
