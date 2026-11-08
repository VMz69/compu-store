import { STORE_CONFIG } from '@/shared/config/store.config'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/info/components/ContactMap.tsx'

const MAP_EMBED_URL =
  'https://www.google.com/maps?q=13.7214635,-88.9349584&z=17&output=embed'
const MAP_OPEN_URL = 'https://maps.app.goo.gl/mhJ5JzDnwjH9ciVK7'

/**
 * Mapa interactivo de la sala de ventas. Se usa el embed de Google Maps dentro
 * de una tarjeta con identidad de marca (bordes redondeados, sombra y un CTA
 * flotante) en lugar del iframe "crudo", para que se sienta parte de la UI.
 */
export const ContactMap = () => (
  <section
    className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-soft-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    {...uiMeta({ id: 'contacto.mapa', component: 'ContactMap', source: SOURCE })}
  >
    <div className="relative h-72 w-full sm:h-80 lg:h-96">
      <iframe
        title="Ubicación de CompuStore SV en Google Maps"
        src={MAP_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
        {...uiMeta({
          id: 'contacto.mapa.iframe',
          component: 'ContactMap',
          source: SOURCE,
        })}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur dark:bg-slate-900/95 dark:text-slate-100">
          <i className="fa-solid fa-location-dot text-brand" />
          Sala de Ventas Física
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/95 px-3 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
          Abierto Lun–Sáb
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md text-xs font-medium leading-relaxed text-white drop-shadow">
          {STORE_CONFIG.address}
        </p>
        <a
          href={MAP_OPEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand shadow-lg transition-all hover:bg-brand hover:text-white active:scale-95"
          {...uiMeta({
            id: 'contacto.mapa.abrir',
            component: 'ContactMap',
            source: SOURCE,
          })}
        >
          <i className="fa-solid fa-diamond-turn-right" />
          Abrir en Google Maps
        </a>
      </div>
    </div>
  </section>
)
