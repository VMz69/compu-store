import { createPortal } from 'react-dom'
import { useAnchoredPopover } from '@/shared/hooks/useAnchoredPopover'
import { cn } from '@/shared/lib/cn'
import { formatShortISO } from '@/shared/lib/date'
import { Calendar } from './Calendar'
import { controlTone } from './controlStyles'

interface DatePickerProps {
  /** "YYYY-MM-DD" o '' (sin fecha). */
  value: string
  /**
   * Mismo contrato que un input: `{...bind('campo')}` funciona tal cual.
   * (Sintaxis de método para aceptar handlers de `ChangeEvent`: solo leen `target.value`.)
   */
  onChange(event: { target: { name?: string; value: string } }): void
  name?: string
  min?: string
  max?: string
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  /** Etiqueta accesible si no hay <label> asociado. */
  'aria-label'?: string
  tone?: 'default' | 'muted'
}

/** Tamaño del calendario emergente (para ubicarlo dentro de la ventana). */
const POPOVER = { width: 300, height: 340 }

/**
 * Selector de fecha propio (reemplaza al `type="date"` del navegador): botón +
 * calendario emergente en portal (no lo recortan paneles con scroll ni modales).
 */
export function DatePicker({ value, onChange, name, min, max, invalid, disabled, placeholder = 'Elegir fecha', tone = 'default', ...rest }: DatePickerProps) {
  const { open, style, anchorRef, popoverRef, toggle, close } = useAnchoredPopover(POPOVER)

  const pick = (iso: string) => {
    onChange({ target: { name, value: iso } })
    close()
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={toggle}
        className={cn('w-full h-8 px-3 rounded-lg text-xs flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed', controlTone(tone, invalid))}
        {...rest}
      >
        <span className={cn('tabular-nums', !value && 'text-slate-400')}>{value ? formatShortISO(value) : placeholder}</span>
        <i className="fa-regular fa-calendar text-slate-400" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Calendario"
            style={style}
            className="z-[70] p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-dropdown dark:shadow-modal-dark animate-fade-in"
            // Escape cierra solo el calendario (no el modal que lo contiene).
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                e.nativeEvent.stopPropagation()
                close()
              }
            }}
          >
            <Calendar value={value} onSelect={pick} min={min} max={max} className="max-w-none" />
          </div>,
          document.body,
        )}
    </>
  )
}
