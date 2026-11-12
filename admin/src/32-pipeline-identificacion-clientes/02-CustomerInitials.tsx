import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import type { CustomerType } from '../33-pipeline-historial-clientes/03-types'

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

/** Iniciales del cliente; el color distingue persona (marca) de empresa (ámbar). */
export function CustomerInitials({ name, type, className }: { name: string; type: CustomerType; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-lg flex items-center justify-center font-black',
        type === 'empresa'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
          : 'bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-300',
        className,
      )}
    >
      {type === 'empresa' && !initialsOf(name) ? <i className="fa-solid fa-building" /> : initialsOf(name)}
    </span>
  )
}
