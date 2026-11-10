import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePermission } from '@/features/access'
import { openModal } from '@/shared/store/modal.store'
import { CATALOG_MODALS } from '../../modals'
import { useCatalogStore } from '../../store'

export type TaxonomyTab = 'categorias' | 'marcas'

/**
 * Vista /categorias: pestaña activa en la URL (?tab=marcas, enlazable y con "atrás"),
 * búsqueda por pestaña y acción contextual de alta.
 */
export function useTaxonomyPage() {
  const [params, setParams] = useSearchParams()
  const tab: TaxonomyTab = params.get('tab') === 'marcas' ? 'marcas' : 'categorias'
  const [search, setSearch] = useState({ categorias: '', marcas: '' })
  const categoryCount = useCatalogStore((s) => s.categories.length)
  const brandCount = useCatalogStore((s) => s.brands.length)
  const canCreate = usePermission('canManageTaxonomy')

  return {
    tab,
    selectTab: (next: TaxonomyTab) => setParams(next === 'marcas' ? { tab: 'marcas' } : {}, { replace: true }),
    counts: { categorias: categoryCount, marcas: brandCount },
    search: search[tab],
    onSearch: (event: { target: { value: string } }) => setSearch((s) => ({ ...s, [tab]: event.target.value })),
    clearSearch: () => setSearch((s) => ({ ...s, [tab]: '' })),
    canCreate,
    createLabel: tab === 'marcas' ? 'Nueva marca' : 'Nueva categoría',
    create: () => openModal(tab === 'marcas' ? CATALOG_MODALS.brandForm : CATALOG_MODALS.categoryForm, null),
  }
}

export type TaxonomyPageApi = ReturnType<typeof useTaxonomyPage>
