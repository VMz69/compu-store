import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFilterStore } from '@/features/catalog'

const SEARCHABLE_VIEWS = ['/category', '/brand', '/search', '/offers', '/favorites']

const isSearchableView = (pathname: string): boolean =>
  SEARCHABLE_VIEWS.some((route) => pathname.startsWith(route))

/**
 * Entrada de búsqueda global con debounce de 300 ms y navegación a /search.
 */
export const useSearchInput = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const value = useFilterStore((state) => state.searchQuery)
  const setQuery = useFilterStore((state) => state.setSearchQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const cancelPendingSearch = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const setValue = (next: string) => {
    setQuery(next)
    cancelPendingSearch()
  }

  const submit = () => {
    cancelPendingSearch()
    if (value.trim() && !isSearchableView(pathname)) {
      navigate('/search')
    }
  }

  const clear = () => {
    cancelPendingSearch()
    setQuery('')
  }

  return { value, setValue, submit, clear, hasValue: value.length > 0 }
}
