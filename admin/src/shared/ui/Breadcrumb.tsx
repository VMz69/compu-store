import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
  meta?: Record<string, string>
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <i className="fa-solid fa-chevron-right text-[8px]" aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand" {...item.meta}>
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700 dark:text-slate-300" aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
