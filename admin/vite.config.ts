import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Normaliza la ruta base a la forma "/", "/admin/", etc. */
const normalizeBase = (value = '/'): string => `/${value.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')

/**
 * Copia `index.html` como `404.html` al terminar el build.
 * GitHub Pages (y otros hostings sin reglas de reescritura) sirven `404.html`
 * ante rutas desconocidas: así una recarga en /productos sigue cargando la SPA.
 */
const spaFallbackPage = (): Plugin => {
  let outDir = 'dist'
  return {
    name: 'compustore:spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      await copyFile(join(outDir, 'index.html'), join(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    // Subcarpeta de despliegue (VITE_BASE_PATH en .env). Afecta assets, router y logos.
    base: normalizeBase(env.VITE_BASE_PATH),
    plugins: [react(), tailwindcss(), spaFallbackPage()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
    },
  }
})
