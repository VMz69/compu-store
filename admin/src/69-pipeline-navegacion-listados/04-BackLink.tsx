import { Link } from 'react-router-dom'

interface BackLinkProps {
  to: string
  /** Destino legible (ej. "Ajustes"): se lee "‹ Ajustes". */
  label: string
}

/**
 * Regreso discreto al nivel anterior, en la esquina superior izquierda del contenido
 * (fuera de la Topbar). Las props extra (trazabilidad) van al enlace.
 */
export function BackLink({ to, label, ...rest }: BackLinkProps) {
  return (
    <Link
      to={to}
      title={`Volver a ${label}`}
      className="inline-flex items-center gap-1 -ml-1 px-1 py-0.5 rounded-md text-[11px] font-bold text-slate-400 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors w-fit"
      {...rest}
    >
      <i className="fa-solid fa-chevron-left text-[9px]" aria-hidden="true" />
      <span>
        <span className="sr-only">Volver a </span>
        {label}
      </span>
    </Link>
  )
}
