import type { HubCardConfig } from './03-hub.config'

/**
 * ⚠️ TARJETAS DESACTIVADAS — este archivo NO se importa en ningún lado.
 *
 * Configuración conservada de las sub-vistas de Ajustes retiradas del hub como
 * oportunidad de escalabilidad futura. Detalle, motivo y pasos para reactivarlas en
 * `src/features/settings/ESCALABILIDAD.md`.
 */
export type FutureHubCardId = 'parametros' | 'mantenimiento'

export const FUTURE_HUB_CARDS: (Omit<HubCardConfig, 'id' | 'spanClass'> & { id: FutureHubCardId })[] = [
  {
    id: 'parametros',
    to: '/ajustes/parametros',
    icon: 'fa-solid fa-scale-balanced',
    iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    badge: 'Normativa SV',
    badgeClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    title: 'Parámetros Fiscales & Moneda',
    description:
      'Moneda de curso legal (USD), alícuota del 13% de IVA según normativa salvadoreña y emisión de DTE / CCF.',
    cta: 'Ver Parámetros Fiscales',
  },
  {
    id: 'mantenimiento',
    to: '/ajustes/mantenimiento',
    icon: 'fa-solid fa-database',
    iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    badge: 'Datos & Memoria',
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    title: 'Mantenimiento & Respaldos',
    description:
      'Exportar snapshot integral JSON, monitoreo del almacenamiento local y restauración de fábrica del demo.',
    cta: 'Herramientas de Mantenimiento',
  },
]
