/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_TRACEABILITY?: string
  readonly VITE_STORE_URL?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_SHOW_DEMO_CREDENTIALS?: string
  /** URL base de la API, incluido el prefijo (p. ej. http://localhost:3000/api/v1). */
  readonly VITE_API_URL?: string
  /** Configuración web de Firebase (app "compustore-admin"); valores públicos, no secretos. */
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
