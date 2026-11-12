/**
 * URL de un archivo de `public/` respetando la ruta base del despliegue.
 *
 * Nunca escribas rutas absolutas como "/logo/icono.png": si la app se despliega
 * en una subcarpeta (VITE_BASE_PATH=/admin/), apuntarían a la raíz del dominio.
 *
 * @example publicUrl('logo/icono.png') // "/logo/icono.png" o "/admin/logo/icono.png"
 */
export const publicUrl = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
