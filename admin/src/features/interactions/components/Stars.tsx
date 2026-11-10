import { cn } from '@/shared/lib/cn'

/** Estrellas de solo lectura (1–5), con texto accesible. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5 text-amber-400', className)} role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= rating ? 'fa-solid fa-star' : 'fa-regular fa-star text-slate-300 dark:text-slate-600'} aria-hidden="true" />
      ))}
    </span>
  )
}
