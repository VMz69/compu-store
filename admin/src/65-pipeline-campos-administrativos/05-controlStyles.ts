/** Estilos compartidos por Input, Select y Textarea (clases completas, sin concatenar fragmentos). */
export type ControlTone = 'default' | 'muted' | 'filter' | 'readonly'

export const CONTROL_TONES: Record<ControlTone, string> = {
  default:
    'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15',
  muted:
    'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-brand',
  filter:
    'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand',
  readonly:
    'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 font-bold text-slate-500 outline-none cursor-not-allowed',
}

/** Reemplaza al tono cuando el control tiene error (no se combina, para evitar choques de clases). */
export const CONTROL_INVALID =
  'border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15'

export const controlTone = (tone: ControlTone, invalid?: boolean): string =>
  invalid ? CONTROL_INVALID : CONTROL_TONES[tone]
