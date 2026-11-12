import type { Brand } from '../features/catalog/types'

const at = '2026-10-01T09:00:00.000Z'
const brand = (id: string, name: string, website: string, description: string): Brand => ({
  id, name, slug: id, website, description, active: true, createdAt: at,
})

/** Marcas del catálogo de prueba (coinciden con `products.mock`). */
export const BRANDS_MOCK: Brand[] = [
  brand('acer', 'Acer', 'https://www.acer.com', 'Laptops y equipos de oficina.'),
  brand('dell', 'Dell', 'https://www.dell.com', 'Equipos empresariales y monitores.'),
  brand('hp', 'HP', 'https://www.hp.com', 'Laptops, impresoras y accesorios.'),
  brand('jbl', 'JBL', 'https://www.jbl.com', 'Audio: bocinas y audífonos.'),
  brand('kingston', 'Kingston', 'https://www.kingston.com', 'Memorias RAM y almacenamiento.'),
  brand('logitech', 'Logitech', 'https://www.logitech.com', 'Periféricos y webcams.'),
  brand('redragon', 'Redragon', 'https://www.redragonzone.com', 'Periféricos gamer.'),
  brand('samsung', 'Samsung', 'https://www.samsung.com', 'Discos SSD, monitores y memorias.'),
]
