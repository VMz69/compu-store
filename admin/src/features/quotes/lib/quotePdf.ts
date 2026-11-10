import { formatCurrency } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/date'
import {
  createPdf,
  drawFooter,
  drawHeader,
  drawInfoBoxes,
  drawItemsTable,
  drawNotes,
  drawTotals,
  pdfFilename,
} from '@/shared/lib/pdf'
import type { Quote } from '../types'
import { calcTotals, lineTotal, validUntil } from './quote.service'

/**
 * PDF formal de una cotización. Usa el kit compartido `shared/lib/pdf` para
 * mantener la misma identidad visual que la factura. Los montos salen de
 * `quote.service` para coincidir con la pantalla.
 */
export async function buildQuotePdf(quote: Quote) {
  const kit = await createPdf({ title: `Cotización ${quote.id}`, author: quote.issuer.name, subject: quote.customer.name })
  const totals = calcTotals(quote.items, quote.charges ?? [], quote.issuer.taxRate)
  const taxPercent = Math.round(quote.issuer.taxRate * 100)
  const c = quote.customer

  let y = drawHeader(kit, {
    issuerName: quote.issuer.name,
    issuerLines: [quote.issuer.address, `Tel. ${quote.issuer.phones.join(' / ')}  ·  ${quote.issuer.email}`],
    title: 'COTIZACIÓN',
    rightLines: [quote.id, `Emitida: ${formatDate(quote.createdAt)}`, `Válida hasta: ${formatDate(validUntil(quote))}`],
  })

  y = drawInfoBoxes(kit, y, [
    {
      title: 'CLIENTE',
      lines: [c.name, c.documentId && `Documento: ${c.documentId}`, c.phone && `Teléfono: ${c.phone}`, c.email && `Correo: ${c.email}`],
    },
    {
      title: 'CONDICIONES',
      lines: [
        `Validez: ${quote.validityDays} días`,
        'Moneda: dólares estadounidenses (USD)',
        `Precios con IVA (${taxPercent}%) incluido`,
        `Atendido por: ${quote.createdBy}`,
      ],
    },
  ])

  y = drawItemsTable(kit, y, {
    head: [['#', 'SKU', 'Descripción', 'Cant.', 'P. unitario', 'Desc.', 'Total']],
    body: [
      ...quote.items.map((item, i) => [
        String(i + 1),
        item.sku,
        item.name,
        String(item.quantity),
        formatCurrency(item.unitPrice),
        item.discountPercent > 0 ? `${item.discountPercent}%` : '—',
        formatCurrency(lineTotal(item)),
      ]),
      // Cargos extra: líneas de servicio (sin SKU).
      ...(quote.charges ?? []).map((c, i) => [
        String(quote.items.length + i + 1),
        'SERVICIO',
        c.concept,
        '1',
        formatCurrency(c.amount),
        '—',
        formatCurrency(c.amount),
      ]),
    ],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, font: 'courier', fontSize: 7.5 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    headAlign: { 0: 'center', 3: 'center', 4: 'right', 5: 'center', 6: 'right' },
  })

  y = drawTotals(kit, y, [
    { label: 'Subtotal', value: formatCurrency(totals.gross) },
    ...(totals.discount > 0 ? [{ label: 'Descuentos', value: `- ${formatCurrency(totals.discount)}` }] : []),
    ...(totals.chargesTotal > 0 ? [{ label: 'Cargos extra', value: `+ ${formatCurrency(totals.chargesTotal)}` }] : []),
    { label: 'Base imponible (sin IVA)', value: formatCurrency(totals.net) },
    { label: `IVA ${taxPercent}% incluido`, value: formatCurrency(totals.tax) },
    { label: 'TOTAL A PAGAR', value: formatCurrency(totals.total), strong: true },
  ])

  drawNotes(kit, y + 2, [
    ...(quote.notes ? [`Nota: ${quote.notes}`] : []),
    `Cotización válida hasta el ${formatDate(validUntil(quote))}. Sujeta a disponibilidad de inventario.`,
    'Precios en dólares (USD) con IVA incluido. Garantía según política del fabricante.',
    'Este documento no es un comprobante fiscal. Para confirmar su pedido, comuníquese a nuestros teléfonos.',
  ])

  drawFooter(kit, `${quote.issuer.name} · ¡Gracias por su preferencia!`, quote.id)
  return kit.doc
}

export const quotePdfFilename = (quote: Quote): string => pdfFilename(quote.id, quote.customer.name)
