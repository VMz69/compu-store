import type { ProveedorImagenes } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import * as repo from './08-productos.repository.js'

/**
 * Imágenes de productos en Cloudinary (D-17) y limpieza de huérfanas:
 * - toda subida queda en `imagenes_pendientes` hasta que un producto la adopta;
 * - el admin descarta en el acto lo que subió si el guardado falla;
 * - en cada subida se barren las pendientes con más de PLAZO_PENDIENTE_MS (red de seguridad);
 * - lo que se quita de un producto se destruye tras el commit y, si Cloudinary falla, se reencola.
 */

export const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp'] as const
export type TipoImagen = (typeof TIPOS_IMAGEN)[number]

/** Igual que `MAX_IMAGE_BYTES` del admin (`17-pipeline-ficha-producto/03-productImages.ts`). */
export const MAX_BYTES_IMAGEN = 1.5 * 1024 * 1024
export const MENSAJE_LIMITE_IMAGEN = 'La imagen supera 1.5 MB. Usa una más liviana.'

export const PLAZO_PENDIENTE_MS = 60 * 60 * 1000
const LOTE_BARRIDO = 50

/** Firma de bytes de cada formato: el Content-Type no basta. */
function coincideFirma(contenido: Buffer, tipo: TipoImagen): boolean {
  const empieza = (bytes: number[], desde = 0) => bytes.every((byte, i) => contenido[desde + i] === byte)
  if (tipo === 'image/png') return empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (tipo === 'image/jpeg') return empieza([0xff, 0xd8, 0xff])
  return contenido.subarray(0, 4).toString('latin1') === 'RIFF' && contenido.subarray(8, 12).toString('latin1') === 'WEBP'
}

const registrarFallo = (accion: string, error: unknown) =>
  console.error(`[imagenes] ${accion}:`, error instanceof Error ? error.message : error)

/** Destruye las pendientes vencidas. Nunca hace fallar la petición que lo dispara. */
export async function barrerPendientes(proveedor: ProveedorImagenes): Promise<void> {
  try {
    const vencidas = await repo.pendientesAnterioresA(new Date(Date.now() - PLAZO_PENDIENTE_MS), LOTE_BARRIDO)
    if (vencidas.length === 0) return
    await proveedor.eliminar(vencidas.map((img) => img.publicId))
    await repo.borrarPendientes(vencidas.map((img) => img.id))
  } catch (error) {
    registrarFallo('barrido de pendientes', error)
  }
}

/** Valida y sube una imagen; queda pendiente hasta que un producto la adopte. */
export async function subir(proveedor: ProveedorImagenes, contenido: unknown, tipo: string | undefined) {
  const tipoValido = TIPOS_IMAGEN.find((t) => t === tipo?.split(';')[0]?.trim().toLowerCase())
  if (!tipoValido || !Buffer.isBuffer(contenido) || contenido.length === 0) {
    throw new ErrorApp('VALIDATION_ERROR', 400, 'Envía la imagen como cuerpo binario con Content-Type image/png, image/jpeg o image/webp.')
  }
  if (contenido.length > MAX_BYTES_IMAGEN) throw new ErrorApp('VALIDATION_ERROR', 400, MENSAJE_LIMITE_IMAGEN)
  if (!coincideFirma(contenido, tipoValido)) {
    throw new ErrorApp('VALIDATION_ERROR', 400, 'El archivo no es una imagen JPG, PNG o WebP válida.')
  }
  if (!proveedor.disponible()) throw new ErrorApp('SERVICE_UNAVAILABLE', 503, 'El almacén de imágenes no está configurado.')

  await barrerPendientes(proveedor)
  let almacenada
  try {
    almacenada = await proveedor.subir(contenido)
  } catch (error) {
    registrarFallo('subida', error)
    throw new ErrorApp('SERVICE_UNAVAILABLE', 503, 'No se pudo subir la imagen. Intenta de nuevo.')
  }
  try {
    return await repo.crearPendiente(almacenada)
  } catch (error) {
    await destruir(proveedor, [almacenada]) // sin registro no se podría limpiar después
    throw error
  }
}

/** Descarta una imagen pendiente (compensación del admin cuando el guardado falla). */
export async function descartar(proveedor: ProveedorImagenes, id: number): Promise<void> {
  const pendiente = await repo.buscarPendiente(id)
  if (!pendiente) throw new ErrorApp('NOT_FOUND', 404, 'La imagen no existe o ya pertenece a un producto.')
  try {
    await proveedor.eliminar([pendiente.publicId])
    await repo.borrarPendientes([pendiente.id])
  } catch (error) {
    registrarFallo('descarte', error) // queda pendiente: el barrido la reintenta
  }
}

/**
 * Galería que se guardará: una URL pendiente se adopta con su publicId, una que ya era
 * del producto conserva el suyo y cualquier otra es externa (publicId null).
 */
export async function resolverGaleria(tx: repo.Tx, urls: string[], actuales: repo.ImagenNueva[]) {
  const pendientes = await repo.pendientesPorUrl(tx, urls)
  const imagenes = urls.map((url) => ({
    url,
    publicId: pendientes.find((p) => p.url === url)?.publicId ?? actuales.find((a) => a.url === url)?.publicId ?? null,
  }))
  await repo.consumirPendientes(
    tx,
    pendientes.map((p) => p.id),
  )
  const retiradas = actuales.filter((a): a is { url: string; publicId: string } => a.publicId !== null && !urls.includes(a.url))
  return { imagenes, retiradas }
}

/** Destruye imágenes ya desvinculadas (tras el commit); si Cloudinary falla, se reencolan para el barrido. */
export async function destruir(proveedor: ProveedorImagenes, imagenes: { publicId: string; url: string }[]): Promise<void> {
  if (imagenes.length === 0) return
  try {
    await proveedor.eliminar(imagenes.map((img) => img.publicId))
  } catch (error) {
    registrarFallo('eliminación', error)
    const pendientes = imagenes.map(({ publicId, url }) => ({ publicId, url }))
    await repo.reencolar(pendientes, new Date(Date.now() - PLAZO_PENDIENTE_MS - 1)).catch((e: unknown) => registrarFallo('reencolar', e))
  }
}
