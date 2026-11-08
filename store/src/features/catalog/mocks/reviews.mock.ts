import type { Review } from '@/types'

export const DEFAULT_REVIEWS: Review[] = [
  {
    id: 901,
    author: 'Kevin R.',
    city: 'Cojutepeque, Cuscatlán',
    rating: 5,
    date: 'Hace 3 días',
    title: 'Excelente compra y asesoría técnica',
    comment:
      'Compré el producto en la sala de ventas frente a Dollar City. Funciona al 100%, súper rápido y la atención fue muy amable.',
    verified: true,
  },
  {
    id: 902,
    author: 'Ing. Marvin C.',
    city: 'San Salvador',
    rating: 5,
    date: 'Hace 1 semana',
    title: 'Totalmente recomendado',
    comment:
      'Excelente calidad y precio. Cumplió con todas las especificaciones descritas y la entrega en tienda fue inmediata.',
    verified: true,
  },
  {
    id: 903,
    author: 'Gabriela S.',
    city: 'Santa Ana',
    rating: 4,
    date: 'Hace 2 semanas',
    title: 'Buen producto y garantía sellada',
    comment:
      'Muy contenta con el rendimiento. La factura vino con garantía sellada por el local de CompuStore SV.',
    verified: true,
  },
]

export const INITIAL_REVIEWS: Record<number, Review[]> = {
  1: [
    {
      id: 101,
      author: 'Kevin Ramos',
      city: 'Cojutepeque, Cuscatlán',
      rating: 5,
      date: 'Hace 3 días',
      title: 'Excelente rendimiento para la oficina',
      comment:
        'Compré la laptop en la sala de ventas frente a Dollar City. Me la entregaron configurada con Windows 11 Pro y vuela para multitarea y oficina. Muy recomendada.',
      verified: true,
    },
    {
      id: 102,
      author: 'Ing. Marvin Castro',
      city: 'San Salvador',
      rating: 5,
      date: 'Hace 1 semana',
      title: 'Impecable estado y batería duradera',
      comment:
        'El equipo reacondicionado viene como nuevo, la batería dura más de 5 horas y el SSD responde al instante. Muy satisfecho con la garantía de tienda.',
      verified: true,
    },
  ],
  2: [
    {
      id: 201,
      author: 'Alejandro Guardado',
      city: 'San Vicente',
      rating: 5,
      date: 'Hace 5 días',
      title: 'Excelente calidad de pantalla IPS',
      comment:
        'Los colores son muy vivos y los 75Hz se notan de inmediato al trabajar todo el día. Gran atención del personal al retirar en tienda.',
      verified: true,
    },
  ],
  3: [
    {
      id: 301,
      author: 'David Méndez',
      city: 'Cojutepeque',
      rating: 5,
      date: 'Hace 2 semanas',
      title: 'Velocidad increíble',
      comment:
        'Mi PC bootea en menos de 10 segundos con este M.2 NVMe Samsung. Totalmente original y con garantía por escrito.',
      verified: true,
    },
  ],
}
