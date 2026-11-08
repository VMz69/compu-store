import { useState } from 'react'

/**
 * Navegación entre secciones (tabs) con anterior/siguiente.
 *
 * @example
 * const tabs = useTabs(['general', 'pricing'] as const)
 * tabs.active // 'general' · tabs.next() · tabs.select('pricing')
 */
export function useTabs<T extends string>(ids: readonly T[], initial: T = ids[0]) {
  const [active, setActive] = useState<T>(initial)
  const index = ids.indexOf(active)

  return {
    active,
    index,
    total: ids.length,
    isFirst: index === 0,
    isLast: index === ids.length - 1,
    select: setActive,
    prev: () => setActive(ids[Math.max(0, index - 1)]),
    next: () => setActive(ids[Math.min(ids.length - 1, index + 1)]),
  }
}
