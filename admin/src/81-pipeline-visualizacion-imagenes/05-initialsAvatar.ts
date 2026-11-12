/**
 * Avatares generados a partir de las iniciales (imagen SVG como data URI).
 *
 * - Sin dependencias ni peticiones de red: se generan en el navegador.
 * - El color se deriva del nombre (hash), así cada persona conserva siempre
 *   el mismo color en todas las vistas.
 * - Al ser una imagen, se puede usar en <img>, en CSS o embebida en un PDF.
 */

/** Paleta afín a la marca. Fondo + tono de texto con contraste AA sobre el fondo. */
const PALETTE = [
  { bg: '#0168F5', fg: '#FFFFFF' }, // brand
  { bg: '#4F46E5', fg: '#FFFFFF' }, // indigo
  { bg: '#7C3AED', fg: '#FFFFFF' }, // violet
  { bg: '#0E7490', fg: '#FFFFFF' }, // cyan oscuro
  { bg: '#047857', fg: '#FFFFFF' }, // emerald oscuro
  { bg: '#B45309', fg: '#FFFFFF' }, // amber oscuro
  { bg: '#BE185D', fg: '#FFFFFF' }, // pink oscuro
  { bg: '#0C192C', fg: '#FFFFFF' }, // navy corporativo
]

/** Títulos que no forman parte del nombre (no aportan iniciales). */
const TITLES = /^(lic|licda|ing|inga|dr|dra|arq|prof|sr|sra|srta)\.?$/i

/** Iniciales (máx. 2): "Licda. Sofía Alvarado" → "SA" · "José" → "J". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w && !TITLES.test(w))
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return picked.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

/** Hash simple y estable (djb2) para elegir el color. */
const hash = (text: string): number => [...text].reduce((h, ch) => (h * 33) ^ ch.charCodeAt(0), 5381) >>> 0

/** Color asignado a un nombre (útil si se necesita el mismo tono fuera del avatar). */
export const avatarColor = (name: string) => PALETTE[hash(name.trim().toLowerCase()) % PALETTE.length]

/**
 * Imagen SVG cuadrada con las iniciales centradas.
 * Usa un cuadrado: el redondeado (círculo, esquinas) lo decide quien la muestra con CSS.
 */
export function initialsAvatarUrl(name: string, size = 128): string {
  const { bg, fg } = avatarColor(name)
  const initials = initialsOf(name)
  const fontSize = Math.round(size * (initials.length > 1 ? 0.4 : 0.46))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="${fg}" ` +
    `font-family="Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="1">` +
    `${initials}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
