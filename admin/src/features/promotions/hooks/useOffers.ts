import { useDeferredValue, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { useCatalogStore } from '@/00-director-catalogo'
import { askConfirm } from '@/shared/store/confirm.store'
import { toast } from '@/shared/store/toast.store'
import { matchesQuery } from '@/shared/lib/text'
import { analyzeProduct, discountText, OFFER_STATUS_META, offerStatus } from '../lib/offerPricing'
import { usePromotionsStore } from '../store'
import type { Offer, OfferStatus } from '../types'

export type OfferFilter = 'all' | OfferStatus

const FILTER_TITLES: Record<OfferFilter, string> = {
  all: 'Todas', vigente: 'Vigentes', programada: 'Programadas', pausada: 'Pausadas', vencida: 'Vencidas',
}

const ORDER: Record<OfferStatus, number> = { vigente: 0, programada: 1, pausada: 2, vencida: 3 }

/** Vista /ofertas: lista con estado derivado, filtro por estado y acciones. */
export function useOffers() {
  const navigate = useNavigate()
  const offers = usePromotionsStore((s) => s.offers)
  const products = useCatalogStore((s) => s.products)
  const togglePause = usePromotionsStore((s) => s.togglePause)
  const deleteOffer = usePromotionsStore((s) => s.deleteOffer)
  const canManage = usePermission('canManageOffers')
  const [filter, setFilter] = useState<OfferFilter>('all')
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search)

  const rows = useMemo(
    () =>
      offers
        .map((offer) => {
          const items = products.filter((p) => offer.productIds.includes(p.id))
          const analyses = items.map((p) => analyzeProduct(p, offer.discountType, offer.discountValue))
          const margins = analyses.map((a) => a.marginPercent).filter((m): m is number => m !== null)
          return {
            offer,
            status: offerStatus(offer),
            productNames: items.map((p) => p.name),
            /** Campos del buscador en tiempo real. */
            searchFields: [
              offer.id, offer.title, offer.badge, offer.description, OFFER_STATUS_META[offerStatus(offer)].label,
              discountText(offer), offer.startDate, offer.endDate,
              ...items.flatMap((p) => [p.name, p.sku, p.brand]),
            ],
            /** Peor margen de la oferta (null si ningún producto tiene costo). */
            minMargin: margins.length ? Math.min(...margins) : null,
            belowCost: analyses.some((a) => a.level === 'below_cost'),
          }
        })
        .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.offer.startDate.localeCompare(b.offer.startDate)),
    [offers, products],
  )

  const counts = rows.reduce<Record<OfferFilter, number>>(
    (acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1, all: acc.all + 1 }),
    { all: 0, vigente: 0, programada: 0, pausada: 0, vencida: 0 },
  )

  const remove = (offer: Offer) => {
    if (offerStatus(offer) === 'vigente') return toast('La oferta está vigente: pásala a pausa antes de eliminarla.', 'warning')
    askConfirm({
      title: `Eliminar oferta ${offer.title}`,
      message: 'Los productos vuelven a su precio base. Los pedidos y cotizaciones ya registrados conservan su precio.',
      confirmText: 'Eliminar oferta',
      onConfirm: () => {
        if (!ensurePermission('canManageOffers', 'No tienes permiso para eliminar ofertas')) return
        deleteOffer(offer.id)
        toast(`Oferta "${offer.title}" eliminada`, 'info')
      },
    })
  }

  const visible = rows.filter((r) => (filter === 'all' || r.status === filter) && matchesQuery(r.searchFields, query))

  return {
    rows: visible,
    /** Área activa para la línea de ubicación de la barra (Ofertas › Vigentes). */
    areaLabel: FILTER_TITLES[filter],
    search: {
      value: search,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
      clear: () => setSearch(''),
      active: search.trim().length > 0,
    },
    counts,
    filter,
    setFilter,
    canManage,
    create: () => navigate('/ofertas/nueva'),
    edit: (offer: Offer) => navigate(`/ofertas/${offer.id}/editar`),
    remove,
    togglePause: (offer: Offer) => {
      if (!ensurePermission('canManageOffers', 'No tienes permiso para modificar ofertas')) return
      const paused = togglePause(offer.id)
      toast(paused ? `Oferta "${offer.title}" pausada: rige el precio base` : `Oferta "${offer.title}" reanudada`, 'info')
    },
  }
}

export type OffersApi = ReturnType<typeof useOffers>
