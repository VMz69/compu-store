import { useState, type KeyboardEvent } from 'react'
import { addDaysISO, parseLocalISO, toLocalISO, todayISO } from '@/shared/lib/date'

export interface CalendarOptions {
  /** Fecha seleccionada "YYYY-MM-DD" ('' = ninguna). */
  value: string
  onSelect: (iso: string) => void
  /** Límites inclusivos "YYYY-MM-DD". */
  min?: string
  max?: string
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

const monthKey = (iso: string) => iso.slice(0, 7)

/**
 * Estado de un calendario mensual (semana inicia en lunes, como en El Salvador).
 * Teclado: ←/→ día · ↑/↓ semana · Re Pág/Av Pág mes · Inicio/Fin semana · Enter/Espacio elige.
 */
export function useCalendar({ value, onSelect, min, max }: CalendarOptions) {
  const today = todayISO()
  const [focused, setFocused] = useState(value || (min && today < min ? min : today))
  const view = parseLocalISO(focused) ?? new Date()
  const year = view.getFullYear()
  const month = view.getMonth()

  const isDisabled = (iso: string) => Boolean((min && iso < min) || (max && iso > max))
  const clamp = (iso: string) => (min && iso < min ? min : max && iso > max ? max : iso)

  // Cuadrícula de 6 semanas: desde el lunes anterior (o igual) al día 1.
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = toLocalISO(new Date(year, month, 1 - offset))
  const days = Array.from({ length: 42 }, (_, i) => {
    const iso = addDaysISO(start, i)
    return { iso, day: Number(iso.slice(8)), inMonth: monthKey(iso) === monthKey(focused), isToday: iso === today, isSelected: iso === value, isDisabled: isDisabled(iso), isFocused: iso === focused }
  })

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    const target = new Date(d.getFullYear(), d.getMonth(), Math.min(view.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
    setFocused(clamp(toLocalISO(target)))
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDaysISO(focused, -1),
      ArrowRight: () => addDaysISO(focused, 1),
      ArrowUp: () => addDaysISO(focused, -7),
      ArrowDown: () => addDaysISO(focused, 7),
      Home: () => addDaysISO(focused, -((view.getDay() + 6) % 7)),
      End: () => addDaysISO(focused, 6 - ((view.getDay() + 6) % 7)),
    }
    if (moves[event.key]) {
      event.preventDefault()
      setFocused(clamp(moves[event.key]()))
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      shiftMonth(event.key === 'PageUp' ? -1 : 1)
    } else if ((event.key === 'Enter' || event.key === ' ') && !isDisabled(focused)) {
      event.preventDefault()
      onSelect(focused)
    }
  }

  const firstOfView = toLocalISO(new Date(year, month, 1))
  const lastOfView = toLocalISO(new Date(year, month + 1, 0))

  return {
    title: `${MONTHS[month]} ${year}`,
    days,
    canPrev: !min || firstOfView > min,
    canNext: !max || lastOfView < max,
    prev: () => shiftMonth(-1),
    next: () => shiftMonth(1),
    select: (iso: string) => {
      if (isDisabled(iso)) return
      setFocused(iso)
      onSelect(iso)
    },
    focus: setFocused,
    onKeyDown,
  }
}

export type CalendarApi = ReturnType<typeof useCalendar>
