import { usePageMeta } from '@/75-pipeline-estado-navegacion/00-director-estado-navegacion'

/**
 * Título de una sub-vista de Ajustes en la barra superior: SOLO el título.
 * El regreso va DENTRO del contenido, discreto, en la esquina superior izquierda
 * (`BackLink`: "‹ Ajustes", o "‹ Usuarios" en Accesos). El atajo de Ajustes de la
 * Topbar también queda resaltado y lleva al hub.
 */
export function useSettingsPageMeta(title: string) {
  usePageMeta({ title })
}
