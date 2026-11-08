/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_TRACEABILITY?: string
  readonly VITE_STORE_URL?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_SHOW_DEMO_CREDENTIALS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
