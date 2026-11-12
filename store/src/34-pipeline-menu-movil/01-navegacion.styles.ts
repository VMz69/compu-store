/** Clases compartidas por las secciones del menú móvil. */
export const MOBILE_SECTION_TITLE =
  'px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500'

/** Enlace de texto de la navbar: la página activa se marca con un subrayado de marca, sin relleno. */
export const navQuickLink = (active: boolean) =>
  `relative h-12 px-3 inline-flex items-center text-sm transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
    active
      ? 'text-brand font-bold after:bg-brand'
      : 'text-slate-600 dark:text-slate-300 font-medium hover:text-brand after:bg-transparent hover:after:bg-brand-200 dark:hover:after:bg-brand-800'
  }`

/** Píldora de Ofertas: degradado ámbar con sombra en claro; versión sutil en oscuro. */
export const navOffersPill = (active: boolean) =>
  `h-9 px-4 rounded-full text-sm font-black flex shrink-0 items-center gap-2 transition-all ${
    active
      ? 'bg-amber-500 text-white ring-2 ring-amber-200 dark:ring-amber-800 shadow-md shadow-amber-500/30'
      : 'bg-linear-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 hover:brightness-105 dark:bg-none dark:bg-amber-950/40 dark:text-amber-300 dark:shadow-none dark:border dark:border-amber-800/60 dark:hover:bg-amber-900/60'
  }`
