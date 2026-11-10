import { useEffect } from 'react'
import { usePageMetaStore, type PageMeta } from '@/shared/store/pageMeta.store'

/**
 * Declara el título de la vista (y su ruta de navegación) para la barra superior.
 * Se limpia al salir de la vista. Usar en sub-vistas: las vistas principales ya
 * toman su nombre del menú.
 *
 * @example usePageMeta({ title: 'Nuevo pedido', crumbs: [{ label: 'Pedidos', to: '/pedidos' }], backTo: { label: 'Pedidos', to: '/pedidos' } })
 */
export function usePageMeta(meta: PageMeta | null) {
  const set = usePageMetaStore((s) => s.set)
  // Clave estable: solo se actualiza si cambia el contenido (no la identidad del objeto).
  const key = JSON.stringify(meta)

  useEffect(() => {
    set(key === 'null' ? null : (JSON.parse(key) as PageMeta))
    return () => set(null)
  }, [key, set])
}
