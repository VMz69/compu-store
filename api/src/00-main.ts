import { crearApp } from './01-app.js'
import { env } from './02-env.js'
import {
  comprobarConfiguracionCloudinary,
  comprobarConfiguracionFirebase,
  desconectarBD,
  pingBD,
  proveedorCloudinary,
  proveedorFirebase,
} from './03-pipeline-conexiones/00-director-conexiones.js'

// Sin credenciales de Firebase la API no puede autenticar: se detiene antes de abrir el puerto.
comprobarConfiguracionFirebase()
// Igual con Cloudinary: sin él no se pueden guardar imágenes de productos (D-17).
comprobarConfiguracionCloudinary()

const app = crearApp({ pingBD, identidad: proveedorFirebase, imagenes: proveedorCloudinary, origenes: env.CORS_ORIGINS })

const servidor = app.listen(env.PORT, () => {
  console.log(`API CompuStore SV escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`)
})

/** Cierre ordenado: deja de aceptar conexiones y libera el pool de la BD. */
function cerrar(senal: string) {
  console.log(`${senal} recibido: cerrando la API…`)
  servidor.close(() => {
    void desconectarBD().finally(() => process.exit(0))
  })
}

process.on('SIGTERM', () => cerrar('SIGTERM'))
process.on('SIGINT', () => cerrar('SIGINT'))
