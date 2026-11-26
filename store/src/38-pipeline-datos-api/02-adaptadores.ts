import type { Brand, Category, Product } from '@/00-director-modelos'
import type { StoreConfig } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'

/**
 * Adaptadores (D-14): traducen el contrato de la API (docs/fase-1/contratos-A.md §4)
 * a los tipos que ya consumen las vistas del store.
 */

/* ---------- Contrato de la API ---------- */

export interface ProductoApi {
  id: number
  slug: string
  sku: string
  nombre: string
  descripcion: string
  categoria: { slug: string; nombre: string }
  marca: { slug: string; nombre: string }
  precio: string
  precioAnterior: string | null
  disponible: number
  etiqueta: string | null
  imagenes: string[]
  especificaciones: { clave: string; valor: string }[]
  calificacion: number | null
  totalResenas: number
}

export interface CategoriaApi {
  slug: string
  nombre: string
  icono: string
  descripcion: string
  totalProductos: number
}

export interface MarcaApi {
  slug: string
  nombre: string
  sitioWeb: string | null
  descripcion: string
  icono: string | null
  totalProductos: number
}

export interface IdentidadApi {
  nombre: string
  eslogan: string
  ciudad: string
  pais: string
  direccion: string
  direccionCorta: string
  telefonos: string[]
  whatsapp: string
  correo: string
  horario: string
  horarioCorto: string
  acercaDe: string
  mision: string
  vision: string
  valores: string[]
  redes: Record<string, string>
  moneda: { codigo: string; simbolo: string; locale: string }
}

export type EstadoLineaApi = 'ok' | 'ajustada' | 'agotado' | 'no-disponible'

export interface LineaValidadaApi {
  productoId: number
  nombre: string | null
  precioUnitario: string | null
  cantidadSolicitada: number
  cantidadDisponible: number
  subtotal: string
  estado: EstadoLineaApi
}

export interface CarritoValidadoApi {
  lineas: LineaValidadaApi[]
  total: string
  valido: boolean
}

/* ---------- Traducción ---------- */

/** Portada genérica para productos sin fotos (no es un dato de negocio). */
const SIN_IMAGEN = 'https://placehold.co/400x300/f8fafc/94a3b8?text=Sin+imagen'
const ICONO_MARCA = 'fa-solid fa-tag'

export const aProducto = (p: ProductoApi): Product => ({
  id: p.id,
  name: p.nombre,
  slug: p.slug,
  brand: p.marca.slug,
  category: p.categoria.slug,
  price: Number(p.precio),
  originalPrice: p.precioAnterior === null ? null : Number(p.precioAnterior),
  stock: p.disponible,
  badge: p.etiqueta,
  rating: p.calificacion ?? 0,
  reviewsCount: p.totalResenas,
  imageUrl: p.imagenes[0] ?? SIN_IMAGEN,
  images: p.imagenes.slice(1),
  description: p.descripcion,
  specs: p.especificaciones.map(({ clave, valor }) => `${clave}: ${valor}`),
})

export const aCategoria = (c: CategoriaApi): Category => ({
  id: c.slug,
  name: c.nombre,
  slug: c.slug,
  icon: c.icono,
  description: c.descripcion,
})

export const aMarca = (m: MarcaApi): Brand => ({
  id: m.slug,
  name: m.nombre,
  slug: m.slug,
  icon: m.icono ?? ICONO_MARCA,
  description: m.descripcion,
})

/**
 * Identidad → `STORE_CONFIG`. Las vistas usan `phones[0]` y `phones[1]`: con un
 * solo teléfono se repite el primero para no romper la vista de contacto.
 */
export const aIdentidad = (i: IdentidadApi): StoreConfig => {
  const phones = i.telefonos.length === 0 ? [i.whatsapp] : i.telefonos
  return {
    name: i.nombre,
    tagline: i.eslogan,
    city: i.ciudad,
    country: i.pais,
    address: i.direccion,
    addressShort: i.direccionCorta,
    phones: phones.length === 1 ? [phones[0], phones[0]] : phones,
    whatsappNumber: i.whatsapp,
    email: i.correo,
    schedule: i.horario,
    scheduleShort: i.horarioCorto,
    about: i.acercaDe,
    mission: i.mision,
    vision: i.vision,
    values: i.valores,
    socials: {
      facebook: i.redes.facebook ?? '',
      instagram: i.redes.instagram ?? '',
      tiktok: i.redes.tiktok ?? '',
      whatsapp: i.redes.whatsapp ?? `https://wa.me/${i.whatsapp}`,
    },
    currency: { code: i.moneda.codigo, symbol: i.moneda.simbolo, locale: i.moneda.locale },
  }
}
