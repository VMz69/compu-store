import type { Category } from '../25-pipeline-persistencia-catalogo/04-types'

export const CATEGORIES_MOCK: Category[] = [
  {
    id: 'computadoras',
    name: 'Computadoras',
    slug: 'computadoras',
    icon: 'fa-solid fa-laptop',
    description: 'Laptops empresariales, equipos de oficina y alto rendimiento.',
  },
  {
    id: 'audio',
    name: 'Audio',
    slug: 'audio',
    icon: 'fa-solid fa-headphones',
    description: 'Audífonos gamers, bocinas inalámbricas y micrófonos con filtro.',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    slug: 'gaming',
    icon: 'fa-solid fa-gamepad',
    description: 'Teclados mecánicos RGB, mouses ópticos y sillas ergonómicas.',
  },
  {
    id: 'componentes',
    name: 'Componentes',
    slug: 'componentes',
    icon: 'fa-solid fa-microchip',
    description: 'Memorias RAM, discos sólidos NVMe y monitores IPS.',
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    icon: 'fa-solid fa-plug',
    description: 'Bases refrigerantes, webcams FHD, cables y adaptadores.',
  },
]
