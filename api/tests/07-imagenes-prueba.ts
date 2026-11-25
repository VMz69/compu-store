import type { ProveedorImagenes } from '../src/03-pipeline-conexiones/00-director-conexiones.js'

/**
 * Almacén de imágenes falso y en memoria (D-17): las pruebas no usan Cloudinary ni red.
 * `fallarEliminar` simula una caída del proveedor y `configurado` la ausencia de credenciales.
 */
export function crearImagenesFalsas() {
  const almacen = new Map<string, string>()
  const eliminadas: string[] = []
  let contador = 0
  const estado = { configurado: true, fallarEliminar: false }

  const proveedor: ProveedorImagenes = {
    disponible: () => estado.configurado,
    subir: async () => {
      contador += 1
      const publicId = `compustore/productos/prueba-${Date.now()}-${contador}`
      const url = `https://res.cloudinary.test/${publicId}.png`
      almacen.set(publicId, url)
      return { url, publicId }
    },
    eliminar: async (publicIds) => {
      if (estado.fallarEliminar) throw new Error('Cloudinary no disponible (simulado)')
      for (const id of publicIds) {
        almacen.delete(id)
        eliminadas.push(id)
      }
    },
  }

  return { proveedor, almacen, eliminadas, estado }
}
