import { uiMeta } from '@/ui-traceability'
import { SearchDropdown } from './SearchDropdown'
import { useSearchDropdown } from '../hooks/useSearchDropdown'
import { containerClass, iconWrapperClass, inputClass, placeholderText, submitClass } from './searchInput.styles'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/search/components/SearchInput.tsx'

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
  const traceId = `layout.search.${variant}`
  const { containerRef, showDropdown, openDropdown, closeDropdown } = useSearchDropdown(
    isDesktop,
    isCollapsed,
    value,
  )

  return (
    <div
      ref={containerRef}
      aria-hidden={isCollapsed || undefined}
      className={containerClass(isDesktop, isCollapsed)}
    >
      <form
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
          closeDropdown()
        }}
        {...uiMeta({ id: traceId, component: 'SearchInput', source: SOURCE })}
      >
        <div className={iconWrapperClass(isDesktop)}>
          <i className={`fa-solid fa-magnifying-glass ${isDesktop ? '' : 'text-sm'}`} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={openDropdown}
          tabIndex={isCollapsed ? -1 : undefined}
          placeholder={placeholderText(isDesktop)}
          className={inputClass(isDesktop)}
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
          className={submitClass(isDesktop)}
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
          closeDropdown()
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
