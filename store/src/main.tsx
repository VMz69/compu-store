import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './00-estilos-globales.css'
import { normalizeInitialView } from '@/02-vista-inicial'
import { EmptyState } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { precargar } from '@/38-pipeline-datos-api/00-director-datos-api'

normalizeInitialView()

const root = createRoot(document.getElementById('root')!)

/** La API no respondió al iniciar: error con reintento, sin datos de muestra (L07B). */
const renderError = (onRetry: () => void) =>
  root.render(
    <StrictMode>
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <EmptyState
          icon="fa-solid fa-plug-circle-exclamation"
          title="No pudimos cargar la tienda"
          description="El catálogo no está disponible en este momento. Revisa tu conexión e inténtalo de nuevo."
          traceId="app.precarga.error"
          action={
            <button
              type="button"
              onClick={onRetry}
              className="bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-rotate-right" />
              <span>Reintentar</span>
            </button>
          }
        />
      </div>
    </StrictMode>,
  )

/**
 * Precarga identidad y catálogo antes del primer render. La app se importa después,
 * para que los módulos que leen la identidad al cargarse ya la encuentren aplicada.
 */
const iniciar = async () => {
  try {
    await precargar()
  } catch {
    renderError(() => void iniciar())
    return
  }
  const { default: App } = await import('./00-director-aplicacion.tsx')
  root.render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
}

void iniciar()
