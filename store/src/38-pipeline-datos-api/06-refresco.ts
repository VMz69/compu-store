import { cargarDatos } from './04-precarga'

/** Intervalo mínimo entre refrescos por cambio de vista (evita descargar en cada clic rápido). */
const INTERVALO_MINIMO_MS = 10_000

let ultimoRefresco = Date.now()
let enCurso: Promise<void> | null = null
let instalado = false

/**
 * Vuelve a pedir identidad y catálogo en segundo plano. Sin pantalla de carga: lo que
 * se ve se reemplaza al llegar los datos nuevos. Si la API falla se conservan los datos
 * actuales en silencio (el carrito y la ficha igual validan antes de WhatsApp).
 */
export function refrescar({ forzar = false }: { forzar?: boolean } = {}): Promise<void> {
  if (enCurso) return enCurso
  if (!forzar && Date.now() - ultimoRefresco < INTERVALO_MINIMO_MS) return Promise.resolve()
  ultimoRefresco = Date.now()
  enCurso = cargarDatos()
    .catch(() => undefined)
    .finally(() => {
      enCurso = null
    })
  return enCurso
}

/** Enlace a la portada (`#/`), p. ej. el logo de la cabecera. */
const esEnlaceAPortada = (objetivo: EventTarget | null): boolean =>
  (objetivo instanceof Element ? objetivo.closest('a') : null)?.getAttribute('href') === '#/'

/**
 * Instala una sola vez el disparador del logo: el clic en cualquier enlace a `#/` fuerza
 * el refresco, aunque ya se esté en la portada o no hayan pasado los 10 s. El refresco
 * por cambio de vista lo dispara `useScrollToTop` (37), que corre en cada cambio de ruta:
 * HashRouter navega con `pushState`, que no emite `hashchange`.
 */
export function iniciarRefresco(): void {
  if (instalado) return
  instalado = true
  ultimoRefresco = Date.now()
  document.addEventListener('click', (event) => {
    if (esEnlaceAPortada(event.target)) void refrescar({ forzar: true })
  })
}
