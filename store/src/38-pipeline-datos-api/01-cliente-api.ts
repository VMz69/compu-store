/**
 * Cliente HTTP de la API pública (`VITE_API_URL`, p. ej. http://localhost:3000/api/v1).
 * Respuestas `{ data, meta? }` y errores `{ error: { code, message } }` (D-06).
 */

const API_URL = import.meta.env.VITE_API_URL as string | undefined
const TIEMPO_LIMITE_MS = 15_000
const LIMITE_PAGINA = 100

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface Sobre<T> {
  data: T
  meta?: { page: number; limit: number; total: number; totalPages: number }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<Sobre<T>> {
  if (!API_URL) throw new ApiError('Falta configurar VITE_API_URL en store/.env.', 0)
  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...init, signal: AbortSignal.timeout(TIEMPO_LIMITE_MS) })
  } catch {
    throw new ApiError('No se pudo conectar con la tienda.', 0)
  }
  const cuerpo = (await respuesta.json().catch(() => null)) as (Sobre<T> & { error?: { message?: string } }) | null
  if (!respuesta.ok || !cuerpo) {
    throw new ApiError(cuerpo?.error?.message ?? 'La tienda no respondió correctamente.', respuesta.status)
  }
  return cuerpo
}

export const obtener = async <T>(ruta: string): Promise<T> => (await pedir<T>(ruta)).data

export const enviar = async <T>(ruta: string, cuerpo: unknown): Promise<T> =>
  (
    await pedir<T>(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  ).data

/** Recorre todas las páginas de un listado (D-06: `limit` ≤ 100). */
export async function obtenerTodas<T>(ruta: string): Promise<T[]> {
  const separador = ruta.includes('?') ? '&' : '?'
  const filas: T[] = []
  for (let page = 1; ; page += 1) {
    const { data, meta } = await pedir<T[]>(`${ruta}${separador}page=${page}&limit=${LIMITE_PAGINA}`)
    filas.push(...data)
    if (!meta || page >= meta.totalPages) return filas
  }
}
