import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

/**
 * Se ejecuta una vez antes de las pruebas: aplica las migraciones pendientes a la BD
 * de pruebas (compustore_test, D-15). En CI, DATABASE_URL llega por el entorno.
 */
export default function aplicarMigraciones(): void {
  const databaseUrl = process.env.DATABASE_URL ?? parseEnv(readFileSync('.env.test', 'utf8')).DATABASE_URL
  if (!databaseUrl) throw new Error('Falta DATABASE_URL en api/.env.test.')
  // Las pruebas vacían tablas: nunca se ejecutan contra una BD que no sea de pruebas.
  const nombreBD = decodeURIComponent(new URL(databaseUrl).pathname.slice(1))
  if (!nombreBD.endsWith('_test')) {
    throw new Error(`Pruebas abortadas: la BD "${nombreBD}" no termina en "_test" (revisa api/.env.test, D-15).`)
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  })
}
