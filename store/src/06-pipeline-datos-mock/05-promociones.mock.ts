import type { Promotion } from '@/00-director-modelos'

export const promotions: Promotion[] = [
  {
    id: 1,
    badge: 'OFERTA ESPECIAL GAMER',
    title: 'AUDÍFONOS GAMERS 7.1',
    discountText: '20% DESCUENTO',
    description:
      'Mejora tu experiencia de juego con sonido inmersivo y micrófono con cancelación de ruido. Unidades limitadas.',
    ctaText: 'Ver Oferta Ahora',
    targetCategory: 'audio',
    badgeColor: 'bg-amber-400 text-amber-950',
    imageUrl:
      'https://placehold.co/500x500/transparent/ffffff?text=Headset+Gamer+Audio+7.1&font=Montserrat',
    gradient: 'from-brand-navy via-brand to-brand-accent',
  },
  {
    id: 2,
    badge: 'PRODUCTIVIDAD Y ESTUDIO',
    title: 'LAPTOPS REFURBISHED',
    discountText: 'DESDE $525.00',
    description:
      'Equipos empresariales de alta durabilidad con procesadores Core i5 y unidades NVMe ultrarrápidas con garantía.',
    ctaText: 'Ver Laptops',
    targetCategory: 'computadoras',
    badgeColor: 'bg-sky-400 text-sky-950',
    imageUrl:
      'https://placehold.co/500x500/transparent/ffffff?text=Laptop+Acer+Core+i5+FHD&font=Montserrat',
    gradient: 'from-slate-900 via-brand-dark to-brand',
  },
  {
    id: 3,
    badge: 'ZONA GAMING & STREAMING',
    title: 'PERIFÉRICOS MECÁNICOS RGB',
    discountText: 'HASTA 15% OFF',
    description:
      'Teclados mecánicos switches blue/red, mouses ergonómicos con sensores ópticos y mousepads extendidos.',
    ctaText: 'Explorar Gaming',
    targetCategory: 'gaming',
    badgeColor: 'bg-emerald-400 text-emerald-950',
    imageUrl:
      'https://placehold.co/500x500/transparent/ffffff?text=Combo+RGB+Teclado+Mecanico&font=Montserrat',
    gradient: 'from-indigo-950 via-brand-navy to-brand-hover',
  },
]
