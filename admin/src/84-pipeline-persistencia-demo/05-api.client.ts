import axios, { type AxiosError } from 'axios'

/**
 * Cliente HTTP de la API de CompuStore (`VITE_API_URL`, p. ej. http://localhost:3000/api/v1).
 * Este pipeline no conoce la sesión: el pipeline de sesión le inyecta cómo obtener el
 * token y qué hacer cuando la API rechaza la sesión (401/403).
 */

/** Error de la API con el código estable del contrato (`{ error: { code, message } }`). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type TokenProvider = () => Promise<string | null>

let getToken: TokenProvider = async () => null
let onSessionRejected: () => void = () => {}

/** Fuente del ID token que viaja en `Authorization: Bearer`. */
export const configureToken = (provider: TokenProvider): void => {
  getToken = provider
}

/** Se invoca cuando la API responde 401 o 403 (sesión inválida o cuenta deshabilitada). */
export const configureSessionRejected = (handler: () => void): void => {
  onSessionRejected = handler
}

const API_URL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({ baseURL: API_URL, timeout: 15_000 })

apiClient.interceptors.request.use(async (config) => {
  if (!API_URL) throw new ApiError('Falta configurar VITE_API_URL en admin/.env.', 0, 'CONFIG_ERROR')
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(undefined, (error: AxiosError<{ error?: { code?: string; message?: string } }> | ApiError) => {
  if (error instanceof ApiError) return Promise.reject(error)
  const status = error.response?.status ?? 0
  const body = error.response?.data?.error
  if (status === 401 || status === 403) onSessionRejected()
  const message = body?.message ?? (status ? 'Error del servidor. Intenta de nuevo.' : 'No se pudo conectar con el servidor.')
  return Promise.reject(new ApiError(message, status, body?.code ?? 'NETWORK_ERROR'))
})
