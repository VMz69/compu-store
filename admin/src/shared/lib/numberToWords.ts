/**
 * Montos en letras (español) para documentos tributarios.
 * Ej.: 40 → "Cuarenta dólares" · 1688.2 → "Mil seiscientos ochenta y ocho dólares con 20/100"
 * Soporta hasta 999 999 999,99.
 */

const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
  'setecientos', 'ochocientos', 'novecientos']

/** 0–999 en letras. */
function belowThousand(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const restWords = rest < 30 ? UNITS[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` y ${UNITS[rest % 10]}` : ''}`
  return [HUNDREDS[hundreds], restWords].filter(Boolean).join(' ')
}

/** "uno" se apocopa delante de un sustantivo: "veintiún mil", "un millón". */
const apocope = (words: string): string => words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')

/** Entero en letras (0 → "cero"). */
export function integerToWords(n: number): string {
  if (n === 0) return 'cero'
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (millions) parts.push(millions === 1 ? 'un millón' : `${apocope(belowThousand(millions))} millones`)
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${apocope(belowThousand(thousands))} mil`)
  if (rest) parts.push(belowThousand(rest))
  return parts.join(' ')
}

/** Monto en dólares en letras, con la primera letra en mayúscula. */
export function amountToWords(amount: number): string {
  const cents = Math.round(amount * 100)
  const dollars = Math.floor(cents / 100)
  const remainder = cents % 100
  const currency = dollars === 1 ? 'dólar' : 'dólares'
  const words = `${apocope(integerToWords(dollars))} ${currency}${remainder ? ` con ${String(remainder).padStart(2, '0')}/100` : ''}`
  return words.charAt(0).toUpperCase() + words.slice(1)
}
