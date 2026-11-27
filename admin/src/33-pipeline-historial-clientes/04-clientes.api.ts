import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { Customer, CustomerDraft, CustomerType } from './03-types'

/**
 * Adaptador del directorio de clientes (L11): `/admin/clientes` ↔ `Customer` del admin (D-14, D-19).
 * El servidor valida, normaliza y decide el teléfono único; aquí solo se traduce.
 */

interface ClienteDto {
  id: number
  tipo: CustomerType
  nombre: string
  documento: string | null
  telefono: string
  correo: string | null
  ciudad: string
  direccion: string
  notas: string
  activo: boolean
  creadoEn: string
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const CUSTOMER_PREFIX = 'CLI-'

/** Id numérico de la API ↔ id del admin `CLI-###` (como `PRD-###`, D-04). */
const toCustomerId = (id: number) => `${CUSTOMER_PREFIX}${String(id).padStart(3, '0')}`
const toApiId = (id: string) => Number(id.slice(CUSTOMER_PREFIX.length))

const toCustomer = (dto: ClienteDto): Customer => ({
  id: toCustomerId(dto.id),
  type: dto.tipo,
  name: dto.nombre,
  documentId: dto.documento ?? '',
  phone: dto.telefono,
  email: dto.correo ?? '',
  city: dto.ciudad,
  address: dto.direccion,
  notes: dto.notas,
  active: dto.activo,
  createdAt: dto.creadoEn,
})

const toClienteBody = (draft: CustomerDraft) => ({
  tipo: draft.type,
  nombre: draft.name,
  documento: draft.documentId,
  telefono: draft.phone,
  correo: draft.email,
  ciudad: draft.city,
  direccion: draft.address,
  notas: draft.notes,
  activo: draft.active,
})

/** Directorio completo, de 100 en 100 (precarga: el admin filtra y pagina en el cliente). */
export async function fetchCustomers(): Promise<Customer[]> {
  const customers: Customer[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<ClienteDto>>('/admin/clientes', { params: { limit: 100, page } })
    customers.push(...data.data.map(toCustomer))
    if (page >= data.meta.totalPages) return customers
  }
}

/** Alta; devuelve el cliente tal como quedó en el servidor (con su id). */
export async function createCustomerApi(draft: CustomerDraft): Promise<Customer> {
  const { data } = await apiClient.post<Envelope<ClienteDto>>('/admin/clientes', toClienteBody(draft))
  return toCustomer(data.data)
}

/** Edición; devuelve el cliente tal como quedó en el servidor. */
export async function updateCustomerApi(id: string, draft: CustomerDraft): Promise<Customer> {
  const { data } = await apiClient.patch<Envelope<ClienteDto>>(`/admin/clientes/${toApiId(id)}`, toClienteBody(draft))
  return toCustomer(data.data)
}

export async function deleteCustomerApi(id: string): Promise<void> {
  await apiClient.delete(`/admin/clientes/${toApiId(id)}`)
}
