import { ListToolbar, LiveSearch, SegmentedTabs, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { BillingApi } from '../../hooks/useBilling'

const t = tracer('BillingToolbar', 'src/features/billing/components/list/BillingToolbar.tsx')

/** Barra estándar de listados: áreas (cola / emitidas) · buscador · estado. */
export function BillingToolbar({ b }: { b: BillingApi }) {
  const isPending = b.tab === 'pending'

  return (
    <ListToolbar
      traceId="billing.toolbar"
      context={['Facturación', b.areaLabel]}
      tabs={
        <SegmentedTabs
          items={[
            { id: 'pending', label: 'Por facturar', count: b.summary.pendingCount, icon: 'fa-solid fa-inbox' },
            { id: 'issued', label: 'Facturas emitidas', count: b.summary.issuedCount, icon: 'fa-solid fa-file-invoice' },
          ]}
          value={b.tab}
          onChange={(id) => (id === 'pending' ? b.showPending() : b.showIssued())}
          aria-label="Secciones de facturación"
          traceId="billing.tab"
        />
      }
      search={
        <LiveSearch
          key={b.tab}
          value={b.search.value}
          onChange={b.search.onChange}
          onClear={b.search.clear}
          resultCount={b.search.resultCount}
          placeholder={isPending ? 'Buscar pedido, cliente, producto, pago…' : 'Buscar factura, pedido, receptor, NIT…'}
          aria-label={isPending ? 'Buscar pedidos por facturar' : 'Buscar facturas emitidas'}
          {...t(`billing.search.${b.tab}`)}
        />
      }
      filters={
        !isPending && (
          <Select tone="filter" options={b.filters.statusOptions} value={b.filters.status} onChange={b.filters.onStatus} aria-label="Filtrar por estado" {...t('billing.issued.status')} />
        )
      }
    />
  )
}
