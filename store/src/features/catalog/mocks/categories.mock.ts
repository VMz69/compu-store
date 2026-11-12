import type { Category } from '@/00-director-modelos'

export const categories: Category[] = [
  {
    id: 'computadoras',
    name: 'Computadoras',
    slug: 'computadoras',
    icon: 'fa-solid fa-laptop',
    description: 'Laptops empresariales y de alto rendimiento',
  },
  {
    id: 'audio',
    name: 'Audio',
    slug: 'audio',
    icon: 'fa-solid fa-headphones',
    description: 'Audífonos gamers, bocinas y micrófonos',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    slug: 'gaming',
    icon: 'fa-solid fa-gamepad',
    description: 'Teclados mecánicos, mouses RGB y sillas ergonómicas',
  },
  {
    id: 'componentes',
    name: 'Componentes',
    slug: 'componentes',
    icon: 'fa-solid fa-microchip',
    description: 'Memorias RAM, discos de estado sólido NVMe y monitores',
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    icon: 'fa-solid fa-plug',
    description: 'Soportes, webcams, cables y adaptadores',
  },
]
