import { getStoreCityName } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'

/** Se evalúa después de la precarga (main.tsx importa la app al tener la identidad). */
export const CONTACT_SUBJECTS = [
  'Cotización de Laptop o Computadora',
  'Consulta sobre Componentes o Accesorios',
  `Disponibilidad en Tienda ${getStoreCityName()}`,
  'Otro motivo',
]
