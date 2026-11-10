import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ensurePermission } from '@/features/access'
import { useCatalogStore, type Product } from '@/features/catalog'
import { useFormState } from '@/shared/hooks/useFormState'
import { toast } from '@/shared/store/toast.store'
import { analyzeProduct, offerStatus, today, validateOffer } from '../lib/offerPricing'
import { usePromotionsStore } from '../store'
import type { DiscountType } from '../types'

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Constructor de ofertas (/ofertas/nueva y /ofertas/:offerId/editar).
 * Calcula en vivo, por producto, el precio de oferta y su margen con los datos
 * del propio producto (precio con IVA, costo e IVA).
 */
export function useOfferBuilder() {
  const navigate = useNavigate()
  const { offerId } = useParams<{ offerId: string }>()
  const [editing] = useState(() => (offerId ? usePromotionsStore.getState().offers.find((o) => o.id === offerId) : undefined))
  const offers = usePromotionsStore((s) => s.offers)
  const saveOffer = usePromotionsStore((s) => s.saveOffer)
  const isLoading = usePromotionsStore((s) => s.isLoading)
  const products = useCatalogStore((s) => s.products)
  const [submitted, setSubmitted] = useState(false)
  const [productIds, setProductIds] = useState<string[]>(editing?.productIds ?? [])

  const start = today()
  const { values, bind, setField } = useFormState({
    title: editing?.title ?? '',
    badge: editing?.badge ?? 'OFERTA ESPECIAL',
    description: editing?.description ?? '',
    discountType: editing?.discountType ?? 'percent',
    discountValue: editing ? String(editing.discountValue) : '10',
    startDate: editing?.startDate ?? start,
    endDate: editing?.endDate ?? addDays(start, 14),
  })
  const type = values.discountType as DiscountType
  const value = Number(values.discountValue.replace(',', '.'))

  const selected = productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
  const analyses = selected.map((p) => analyzeProduct(p, type, Number.isFinite(value) ? value : 0))
  const input = { id: editing?.id, title: values.title, discountType: type, discountValue: value, startDate: values.startDate, endDate: values.endDate, productIds }
  const errors = submitted ? validateOffer(input, analyses, offers) : {}
  const margins = analyses.map((a) => a.marginPercent).filter((m): m is number => m !== null)

  const submit = async () => {
    setSubmitted(true)
    if (Object.keys(validateOffer(input, analyses, offers)).length > 0) return toast('Revisa los datos de la oferta.', 'warning')
    if (!ensurePermission('canManageOffers', 'Su rol no puede gestionar ofertas')) return
    const { offer, created } = await saveOffer({
      id: editing?.id, title: values.title.trim(), badge: values.badge.trim(), description: values.description.trim(),
      productIds, discountType: type, discountValue: value, startDate: values.startDate, endDate: values.endDate,
      paused: editing?.paused ?? false,
    })
    toast(created ? `Oferta "${offer.title}" creada` : `Oferta "${offer.title}" actualizada`, 'success')
    navigate('/ofertas')
  }

  return {
    isEdit: Boolean(editing),
    notFound: Boolean(offerId) && !editing,
    /** Una oferta vencida es historial: solo lectura. */
    readOnly: editing ? offerStatus(editing) === 'vencida' : false,
    bind,
    discountType: type,
    setDiscountType: (next: DiscountType) => setField('discountType', next),
    errors,
    analyses,
    summary: {
      count: analyses.length,
      avgSaving: analyses.length ? analyses.reduce((acc, a) => acc + a.savingPercent, 0) / analyses.length : 0,
      minMargin: margins.length ? Math.min(...margins) : null,
      lowCount: analyses.filter((a) => a.level === 'low').length,
      belowCount: analyses.filter((a) => a.level === 'below_cost').length,
    },
    /** Selector: clic agrega o quita el producto. */
    quantities: Object.fromEntries(productIds.map((id) => [id, 1])),
    toggleProduct: (p: Product) => setProductIds((ids) => (ids.includes(p.id) ? ids.filter((id) => id !== p.id) : [...ids, p.id])),
    removeProduct: (id: string) => setProductIds((ids) => ids.filter((x) => x !== id)),
    submit,
    cancel: () => navigate('/ofertas'),
    isLoading,
  }
}

export type OfferBuilderApi = ReturnType<typeof useOfferBuilder>
