import type { GState, jsPDF } from 'jspdf'
import type { CellHookData, UserOptions } from 'jspdf-autotable'
import { LOGOS } from '@/85-pipeline-identificadores-texto/03-store.config'

/**
 * Kit de maquetación de documentos PDF (A4 vertical, unidades en mm).
 *
 * Lo comparten la cotización y la factura para que ambos documentos tengan la
 * misma identidad visual: encabezado con logo, cajas de datos, tabla con
 * cabecera de marca, bloque de totales a la derecha y pie con paginación.
 *
 * - jsPDF y jspdf-autotable se cargan bajo demanda (no pesan en el bundle inicial).
 * - Fuente Helvetica estándar: soporta tildes y ñ. No usar emojis.
 * - Cada función dibuja y devuelve la coordenada Y siguiente, para encadenar.
 */

export const PDF_COLORS = {
  brand: [1, 104, 245] as [number, number, number], // #0168f5
  navy: [12, 25, 44] as [number, number, number], // #0c192c
  muted: [100, 116, 139] as [number, number, number], // slate-500
  box: [241, 245, 249] as [number, number, number], // slate-100
  line: [226, 232, 240] as [number, number, number], // slate-200
}
export const MARGIN = 15
export const PAGE_WIDTH = 210
export const RIGHT = PAGE_WIDTH - MARGIN

type AutoTable = (doc: jsPDF, options: UserOptions) => void
export interface PdfKit {
  doc: jsPDF
  autoTable: AutoTable
  /** Constructor de estados gráficos (transparencias), ej. sellos de agua. */
  GState: typeof GState
  logo: { dataUrl: string; width: number; height: number } | null
}

/** El logo original mide 2797 px: se reduce para no inflar el PDF (≈8 MB → pocos KB). */
const LOGO_MAX_WIDTH = 600

async function loadLogo(url: string): Promise<PdfKit['logo']> {
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, LOGO_MAX_WIDTH / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height }
  } catch {
    return null // sin logo se imprime el nombre comercial
  }
}

/** Crea el documento con sus metadatos y carga librerías + logo en paralelo. */
export async function createPdf(meta: { title: string; author: string; subject?: string }): Promise<PdfKit> {
  const [{ jsPDF, GState }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLogo(LOGOS.horizontal),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties(meta)
  return { doc, autoTable, GState, logo }
}

interface HeaderOptions {
  issuerName: string
  /** Líneas bajo el logo (dirección, teléfonos…). Se ajustan al ancho. */
  issuerLines: string[]
  title: string
  /** Texto pequeño bajo el título (ej. "Documento Tributario Electrónico"). */
  subtitle?: string
  /** Líneas a la derecha: la primera va destacada (número del documento). */
  rightLines: string[]
}

/** Encabezado: logo + emisor (izquierda) · título y referencias (derecha) · línea de marca. */
export function drawHeader({ doc, logo }: PdfKit, o: HeaderOptions): number {
  const { brand, navy, muted } = PDF_COLORS
  if (logo) doc.addImage(logo.dataUrl, 'PNG', MARGIN, 12, (logo.width / logo.height) * 13, 13, undefined, 'FAST')
  else doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...navy).text(o.issuerName, MARGIN, 20)

  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...muted)
  const issuer = o.issuerLines.flatMap((line) => doc.splitTextToSize(line, 100) as string[])
  doc.text(issuer, MARGIN, 31)

  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...brand).text(o.title, RIGHT, 19, { align: 'right' })
  let y = 19
  if (o.subtitle) doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...muted).text(o.subtitle, RIGHT, (y += 5), { align: 'right' })
  o.rightLines.forEach((line, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal').setFontSize(i === 0 ? 10 : 8.5).setTextColor(...(i === 0 ? navy : muted))
    doc.text(line, RIGHT, (y += i === 0 ? 6 : 5), { align: 'right' })
  })

  const bottom = Math.max(31 + issuer.length * 3.6, y) + 5
  doc.setDrawColor(...brand).setLineWidth(0.6).line(MARGIN, bottom, RIGHT, bottom)
  return bottom + 5
}

/** Alto de una línea de 8.5 pt en mm (tamaño × interlineado 1.15 × 0.3528 mm/pt). */
const LINE_MM = 3.45

/** Cajas grises con título de marca (2 por fila). La altura se ajusta a la caja más larga. */
export function drawInfoBoxes({ doc }: PdfKit, y: number, boxes: Array<{ title: string; lines: string[] }>): number {
  const { brand, navy, box } = PDF_COLORS
  const width = (RIGHT - MARGIN - 6) / 2
  const prepared = boxes.map((b) => b.lines.filter(Boolean).flatMap((l) => doc.setFontSize(8.5).splitTextToSize(l, width - 8) as string[]))
  const height = 14 + Math.max(...prepared.map((lines) => lines.length)) * LINE_MM
  boxes.forEach((b, i) => {
    const x = MARGIN + i * (width + 6)
    doc.setFillColor(...box).roundedRect(x, y, width, height, 2, 2, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...brand).text(b.title, x + 4, y + 6)
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...navy).text(prepared[i], x + 4, y + 11.5)
  })
  return y + height + 6
}

/** Tabla de detalle con el estilo de marca. `headAlign` replica la alineación de cada columna en la cabecera. */
export function drawItemsTable(
  { doc, autoTable }: PdfKit,
  y: number,
  options: Pick<UserOptions, 'head' | 'body' | 'columnStyles'> & {
    headAlign?: Record<number, 'center' | 'right'>
    /** Tamaño de letra (8.5 por defecto; usar 7.5 en tablas con muchas columnas). */
    fontSize?: number
  },
): number {
  const { brand, navy } = PDF_COLORS
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: options.head,
    body: options.body,
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: options.fontSize ?? 8.5, cellPadding: 2.5, textColor: navy },
    headStyles: { fillColor: brand, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: options.columnStyles,
    didParseCell: (data: CellHookData) => {
      const align = options.headAlign?.[data.column.index]
      if (data.section === 'head' && align) data.cell.styles.halign = align
    },
  })
  // `lastAutoTable` lo agrega el plugin al documento.
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
}

/** Bloque de totales alineado a la derecha. La fila `strong` va separada por una línea. */
export function drawTotals({ doc }: PdfKit, y: number, rows: Array<{ label: string; value: string; strong?: boolean }>): number {
  const { navy, muted, line } = PDF_COLORS
  const labelX = RIGHT - 80
  for (const row of rows) {
    if (row.strong) {
      doc.setDrawColor(...line).setLineWidth(0.3).line(labelX, y - 2, RIGHT, y - 2)
      y += 3
    }
    doc.setFont('helvetica', row.strong ? 'bold' : 'normal').setFontSize(row.strong ? 11 : 9).setTextColor(...(row.strong ? navy : muted))
    doc.text(row.label, labelX, y).text(row.value, RIGHT, y, { align: 'right' })
    y += row.strong ? 8 : 5.5
  }
  return y + 2
}

/** Línea etiquetada a todo el ancho (ej. "Valor en letras: Cuarenta dólares"). */
export function drawLabeledLine({ doc }: PdfKit, y: number, label: string, value: string): number {
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...PDF_COLORS.navy).text(`${label}:`, MARGIN, y)
  const labelWidth = doc.getTextWidth(`${label}: `) // medido en negrita, antes de cambiar la fuente
  doc.setFont('helvetica', 'normal').text(value, MARGIN + labelWidth, y)
  return y + 7
}

/** Viñetas de notas/términos en gris. */
export function drawNotes({ doc }: PdfKit, y: number, notes: string[]): number {
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...PDF_COLORS.muted)
  const lines = notes.flatMap((n) => doc.splitTextToSize(`•  ${n}`, RIGHT - MARGIN) as string[])
  doc.text(lines, MARGIN, y, { lineHeightFactor: 1.5 })
  return y + lines.length * 4.3 + 2
}

/** Pie en todas las páginas: texto institucional + referencia y paginación. */
export function drawFooter({ doc }: PdfKit, left: string, reference: string): void {
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(...PDF_COLORS.line).setLineWidth(0.3).line(MARGIN, 284, RIGHT, 284)
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...PDF_COLORS.muted)
    doc.text(left, MARGIN, 289)
    doc.text(`${reference} · Página ${page} de ${pages}`, RIGHT, 289, { align: 'right' })
  }
}

/** Nombre de archivo seguro: "<ref>_<nombre>.pdf". */
export const pdfFilename = (reference: string, name: string): string =>
  `${reference}_${name.replace(/[^\p{L}\p{N}]+/gu, '_')}.pdf`
