import { useEffect, useRef, useState } from 'react'
import { uiMeta } from '@/ui-traceability'
import { SearchDropdown } from '@/components/layout/SearchDropdown'
import { useSearchLock } from '@/hooks/useSearchLock'
import type { Product } from '@/types'

const SOURCE = 'src/components/layout/SearchInput.tsx'

interface SearchInputProps {
  variant: 'desktop' | 'mobile'
  value: string
  hasValue: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  collapsed?: boolean
  suggestions?: Product[]
  onSelectSuggestion?: (product: Product) => void
  onAddToCartSuggestion?: (product: Product) => void
}

export const SearchInput = ({
  variant,
  value,
  hasValue,
  onChange,
  onSubmit,
  onClear,
  collapsed = false,
  suggestions = [],
  onSelectSuggestion,
  onAddToCartSuggestion,
}: SearchInputProps) => {
  const isDesktop = variant === 'desktop'
  const isCollapsed = !isDesktop && collapsed
  const [openState, setOpenState] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const traceId = `layout.search.${variant}`

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) setOpenState(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenState(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const closeDropdown = () => setOpenState(false)
  const isOpen = !isCollapsed && openState
  const showDropdown = isOpen && value.trim().length > 0

  useSearchLock(!isDesktop && showDropdown)

  return (
    <div
      ref={containerRef}
      aria-hidden={isCollapsed || undefined}
      className={
        isDesktop
          ? 'relative hidden lg:flex flex-1 max-w-2xl mx-4 lg:mx-8'
          : `relative lg:hidden transition-all duration-300 ease-out ${
              isCollapsed
                ? 'max-h-0 overflow-hidden opacity-0 pointer-events-none'
                : 'max-h-24 overflow-visible opacity-100 pb-3'
            }`
      }
    >
      <form
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
          setOpenState(false)
        }}
        {...uiMeta({ id: traceId, component: 'SearchInput', source: SOURCE })}
      >
        <div
          className={`absolute inset-y-0 left-0 ${isDesktop ? 'pl-3.5' : 'pl-3'} flex items-center pointer-events-none text-slate-400`}
        >
          <i className={`fa-solid fa-magnifying-glass ${isDesktop ? '' : 'text-sm'}`} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpenState(true)}
          tabIndex={isCollapsed ? -1 : undefined}
          placeholder={
            isDesktop
              ? 'Buscar por producto, marca o categoría (ej. Laptop, Dell, M.2)...'
              : 'Buscar en CompuStore SV...'
          }
          className={`block w-full ${
            isDesktop
              ? 'pl-10 pr-24 py-2.5 text-sm border-slate-300 dark:border-slate-700 bg-slate-50'
              : 'pl-9 pr-20 py-2 text-xs border-slate-300 dark:border-slate-700 bg-slate-50'
          } border rounded-full leading-5 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all`}
          {...uiMeta({
            id: `${traceId}.input`,
            component: 'SearchInput',
            source: SOURCE,
          })}
        />
        {hasValue ? (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar búsqueda"
            tabIndex={isCollapsed ? -1 : undefined}
            className="absolute inset-y-0 right-16 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            {...uiMeta({
              id: `${traceId}.clear`,
              component: 'SearchInput',
              source: SOURCE,
            })}
          >
            <i className="fa-solid fa-circle-xmark text-sm" />
          </button>
        ) : null}
        <button
          type="submit"
          tabIndex={isCollapsed ? -1 : undefined}
          className={`absolute inset-y-1 right-1 bg-brand hover:bg-brand-hover text-white rounded-full ${
            isDesktop ? 'px-5 text-sm' : 'px-3 text-xs'
          } font-semibold transition-colors shadow-sm cursor-pointer`}
          {...uiMeta({
            id: `${traceId}.submit`,
            component: 'SearchInput',
            source: SOURCE,
          })}
        >
          Buscar
        </button>
      </form>

      {!isDesktop && showDropdown ? (
        <button
          type="button"
          aria-label="Cerrar búsqueda"
          onClick={closeDropdown}
          className="fixed inset-x-0 bottom-0 z-30 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          style={{ top: '7.25rem' }}
          {...uiMeta({
            id: 'layout.search.backdrop',
            component: 'SearchInput',
            source: SOURCE,
          })}
        />
      ) : null}

      <SearchDropdown
        open={showDropdown}
        query={value}
        suggestions={suggestions}
        onSelect={(product) => {
          onSelectSuggestion?.(product)
          setOpenState(false)
          onClear()
        }}
        onAddToCart={(product) => {
          onAddToCartSuggestion?.(product)
        }}
        onClose={closeDropdown}
      />
    </div>
  )
}
