/** Claves de persistencia en localStorage (una por store de dominio). */
export const STORAGE_KEYS = {
  ACCESS: 'compustore_sv_bo_access_v1',
  CATALOG: 'compustore_sv_bo_catalog_v1',
  CUSTOMERS: 'compustore_sv_bo_customers_v1',
  SALES: 'compustore_sv_bo_sales_v1',
  INVOICES: 'compustore_sv_bo_invoices_v1',
  PROMOTIONS: 'compustore_sv_bo_promos_v1',
  QUOTES: 'compustore_sv_bo_quotes_v1',
  SETTINGS: 'compustore_sv_bo_settings_v1',
  INTERACTIONS: 'compustore_sv_bo_reviews_v1',
  THEME: 'compustore_sv_theme',
} as const

/** Lectura cruda tolerante a modo privado / almacenamiento bloqueado. */
export const readRaw = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writeRaw = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}
