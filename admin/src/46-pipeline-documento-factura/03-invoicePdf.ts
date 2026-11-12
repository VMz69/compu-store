import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { amountToWords } from '@/79-pipeline-consulta-documentos/04-numberToWords'
import {
  createPdf,
  drawFooter,
  drawHeader,
  drawInfoBoxes,
  drawItemsTable,
  drawLabeledLine,
  drawNotes,
  drawTotals,
  pdfFilename,
  type PdfKit,
} from '@/79-pipeline-consulta-documentos/03-pdf'
import type { Invoice } from '../47-pipeline-persistencia-facturas/03-types'
import { invoiceTotals, lineAmount } from '../47-pipeline-persistencia-facturas/02-invoice.service'

/**
 * PDF de la Factura (DTE-01, Consumidor Final) siguiendo la estructura del
 * documento de muestra: identificación del DTE, emisor, receptor, cuerpo con
 * columnas de ventas no sujetas/exentas/gravadas, valor en letras y totales.
 * Usa el kit compartido para mantener la misma identidad visual que la cotización.
 */

const pad = (n: number) => String(n).padStart(2, '0')
const dateParts = (iso: string) => {
  const d = new Date(iso)
  return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
}

/**
 * Sello diagonal para facturas anuladas. Se dibuja al final y semitransparente
 * para quedar por encima de cajas y tabla sin impedir la lectura.
 */
function drawVoidStamp({ doc, GState }: PdfKit) {
  doc.saveGraphicsState()
  doc.setGState(new GState({ opacity: 0.18 }))
  doc.setFont('helvetica', 'bold').setFontSize(90).setTextColor(220, 38, 38)
  doc.text('ANULADA', 105, 175, { align: 'center', angle: 30 })
  doc.restoreGraphicsState()
}

export async function buildInvoicePdf(invoice: Invoice) {
  const kit = await createPdf({ title: `Factura ${invoice.id}`, author: invoice.issuer.legalName, subject: invoice.receptor.name })
  const { issuer, receptor } = invoice
  const totals = invoiceTotals(invoice.items)
  const { date, time } = dateParts(invoice.createdAt)
  const money = (n: number) => formatCurrency(n)

  let y = drawHeader(kit, {
    issuerName: issuer.tradeName,
    issuerLines: [issuer.address, `Tel. ${issuer.phone}  ·  ${issuer.email}`],
    title: 'FACTURA',
    subtitle: 'Documento Tributario Electrónico',
    rightLines: [invoice.id, `Fecha de generación: ${date}`, `Hora de generación: ${time}`],
  })

  y = drawInfoBoxes(kit, y, [
    {
      title: 'IDENTIFICACIÓN DEL DOCUMENTO',
      lines: [
        `Código de generación: ${invoice.generationCode}`,
        `Sello de recepción*: ${invoice.receptionSeal}`,
        `Id control interno: ${invoice.internalId}`,
        `Creado por: ${issuer.legalName}`,
      ],
    },
    {
      title: 'DATOS DE GENERACIÓN',
      lines: ['Modelo de facturación: Previo', 'Tipo de transmisión: Normal', `Pedido de origen: ${invoice.orderId}`, `Atendido por: ${invoice.createdBy}`],
    },
  ])

  y = drawInfoBoxes(kit, y, [
    {
      title: 'DATOS DEL EMISOR',
      lines: [
        `Nombre: ${issuer.tradeName}`,
        `NIT: ${issuer.nit}  ·  NRC: ${issuer.nrc}`,
        `Dirección: ${issuer.address}`,
        `Teléfono: ${issuer.phone}`,
        `Correo: ${issuer.email}`,
        `Tipo de establecimiento: ${issuer.establishmentType}`,
        `Actividad económica: ${issuer.economicActivity}`,
      ],
    },
    {
      title: 'DATOS DEL RECEPTOR',
      lines: [
        `Nombre: ${receptor.name}`,
        receptor.documentId && `Documento: ${receptor.documentId}`,
        `Dirección: ${receptor.address || 'Ciudad'}`,
        `Correo: ${receptor.email || '—'}`,
        receptor.phone && `Teléfono: ${receptor.phone}`,
        `Condición de pago: ${invoice.paymentCondition}`,
      ],
    },
  ])

  y = drawItemsTable(kit, y, {
    head: [['Cant.', 'Unidad', 'Descripción', 'Precio unit.', 'Descuento', 'No sujetas', 'Exentas', 'Gravadas']],
    body: invoice.items.map((item) => [
      String(item.quantity),
      item.unit,
      item.description,
      money(item.unitPrice),
      money(item.discount),
      money(0),
      money(0),
      money(lineAmount(item)),
    ]),
    // 8 columnas (como el DTE de Hacienda): letra 7.5 para que los encabezados no se partan.
    fontSize: 7.5,
    columnStyles: {
      0: { cellWidth: 13, halign: 'center' },
      1: { cellWidth: 15 },
      3: { cellWidth: 21, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 19, halign: 'right' },
      6: { cellWidth: 17, halign: 'right' },
      7: { cellWidth: 21, halign: 'right', fontStyle: 'bold' },
    },
    headAlign: { 0: 'center', 3: 'right', 4: 'right', 5: 'right', 6: 'right', 7: 'right' },
  })

  y = drawLabeledLine(kit, y, 'Valor en letras', amountToWords(totals.total))

  y = drawTotals(kit, y, [
    { label: 'Sumatoria de ventas', value: money(totals.taxed) },
    { label: 'Monto global desc., rebajas y otros', value: money(totals.discount) },
    { label: 'Sub-total', value: money(totals.taxed) },
    { label: 'IVA retenido', value: money(0) },
    { label: 'Retención renta', value: money(0) },
    { label: 'Monto total de la operación', value: money(totals.total) },
    { label: 'Total otros montos no afectos', value: money(0) },
    { label: 'TOTAL A PAGAR', value: money(totals.total), strong: true },
  ])

  drawNotes(kit, y, [
    `Responsable por parte del emisor: ${issuer.legalName} · NIT ${issuer.nit}`,
    `Responsable por parte del receptor: ${receptor.name} · Documento: ${receptor.documentId || 'N/A'}`,
    `Observaciones: ${invoice.notes || '---'}`,
    '*Sello de recepción simulado: documento generado en el sistema interno, pendiente de transmisión al Ministerio de Hacienda.',
    ...(invoice.status === 'anulada' && invoice.voidedAt ? [`Documento ANULADO el ${dateParts(invoice.voidedAt).date}.`] : []),
  ])

  if (invoice.status === 'anulada') drawVoidStamp(kit)
  drawFooter(kit, `${issuer.tradeName} · ${issuer.legalName}`, invoice.id.replace('DTE-01-M001P001-', 'Factura '))
  return kit.doc
}

export const invoicePdfFilename = (invoice: Invoice): string => pdfFilename(invoice.id, invoice.receptor.name)
