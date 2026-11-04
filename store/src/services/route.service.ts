const LEGACY_VIEW_PARAMS = new Set(['expediente'])

/**
 * Limpia parámetros de vista heredados que no representan la home real.
 * La vista inicial del front-office es `Home` en `#/`.
 */
export const normalizeInitialView = (): void => {
  const url = new URL(window.location.href)
  const view = url.searchParams.get('view')

  if (!view || !LEGACY_VIEW_PARAMS.has(view.toLowerCase())) return

  url.searchParams.delete('view')
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', cleanUrl)
}
