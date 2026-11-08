/** Accesos rápidos del panel de existencias. `icon` incluye su color (clases completas). */
export const QUICK_LINKS = [
  { id: 'inventario', label: 'Inventario', to: '/productos', icon: 'fa-solid fa-box text-brand' },
  { id: 'interacciones', label: 'Interacciones', to: '/interacciones', icon: 'fa-solid fa-comments text-amber-500' },
] as const
