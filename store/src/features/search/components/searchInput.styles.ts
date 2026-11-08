/**
 * Clases Tailwind de `SearchInput` por variante (desktop / mobile).
 * Extraídas del componente para mantenerlo como presentación pura.
 */

export const containerClass = (isDesktop: boolean, isCollapsed: boolean): string =>
  isDesktop
    ? 'relative hidden lg:flex flex-1 max-w-2xl mx-4 lg:mx-8'
    : `relative lg:hidden transition-all duration-300 ease-out ${
        isCollapsed
          ? 'max-h-0 overflow-hidden opacity-0 pointer-events-none'
          : 'max-h-24 overflow-visible opacity-100 pb-3'
      }`

export const iconWrapperClass = (isDesktop: boolean): string =>
  `absolute inset-y-0 left-0 ${isDesktop ? 'pl-3.5' : 'pl-3'} flex items-center pointer-events-none text-slate-400`

export const inputClass = (isDesktop: boolean): string =>
  `block w-full ${
    isDesktop
      ? 'pl-10 pr-24 py-2.5 text-sm border-slate-300 dark:border-slate-700 bg-slate-50'
      : 'pl-9 pr-20 py-2 text-xs border-slate-300 dark:border-slate-700 bg-slate-50'
  } border rounded-full leading-5 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all`

export const submitClass = (isDesktop: boolean): string =>
  `absolute inset-y-1 right-1 bg-brand hover:bg-brand-hover text-white rounded-full ${
    isDesktop ? 'px-5 text-sm' : 'px-3 text-xs'
  } font-semibold transition-colors shadow-sm cursor-pointer`

export const placeholderText = (isDesktop: boolean): string =>
  isDesktop
    ? 'Buscar por producto, marca o categoría (ej. Laptop, Dell, M.2)...'
    : 'Buscar en CompuStore SV...'
