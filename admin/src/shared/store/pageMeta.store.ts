import { create } from 'zustand'

export interface PageCrumb {
  label: string
  to: string
}

/** Etiqueta junto al título (ej. "Desde COT-2026-006", "Historial"). */
export interface PageBadge {
  label: string
  icon?: string
  tone?: 'brand' | 'neutral'
}

/**
 * Título único de la vista, mostrado SOLO en la barra superior (Topbar).
 * Las sub-vistas lo declaran con `usePageMeta`; si no hay nada declarado, la Topbar
 * usa el nombre de la vista del menú. Así ninguna página repite su título.
 */
export interface PageMeta {
  title: string
  /** Niveles anteriores (enlaces), ej. Ajustes › Usuarios. */
  crumbs?: PageCrumb[]
  /** Botón "volver" junto al título (sub-vistas). */
  backTo?: PageCrumb
  badge?: PageBadge
}

interface PageMetaState {
  meta: PageMeta | null
  set: (meta: PageMeta | null) => void
}

export const usePageMetaStore = create<PageMetaState>()((set) => ({
  meta: null,
  set: (meta) => set({ meta }),
}))
