import { defineConfig } from 'prisma/config'

// La CLI de Prisma no carga .env por sí sola: se lee aquí con la API nativa de Node.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile('.env')
  } catch {
    // Sin .env (CI o Railway): las variables llegan por el entorno.
  }
}

// Shadow DB (compustore_shadow): solo la usa `prisma migrate dev` para validar migraciones.
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma db seed` (pnpm db:sembrar). Hereda DATABASE_URL del entorno cargado arriba.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
})
