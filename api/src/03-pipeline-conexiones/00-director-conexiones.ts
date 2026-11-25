// API pública del pipeline de conexiones.
export { prisma, pingBD, desconectarBD } from './01-prisma.js'
export {
  comprobarConfiguracionFirebase,
  proveedorFirebase,
  type Identidad,
  type ProveedorIdentidad,
} from './02-firebase.js'
