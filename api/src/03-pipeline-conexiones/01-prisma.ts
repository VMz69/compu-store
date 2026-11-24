import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../generated/prisma/client.js'
import { env } from '../02-env.js'

/**
 * Configuración del pool a partir de DATABASE_URL. Los tiempos de espera son cortos
 * para que /health responda 503 enseguida si la BD no está disponible.
 */
function configuracionPool(url: string) {
  const { hostname, port, username, password, pathname } = new URL(url)
  return {
    host: hostname,
    port: port ? Number(port) : 3306,
    user: decodeURIComponent(username),
    password: decodeURIComponent(password),
    database: decodeURIComponent(pathname.replace(/^\//, '')),
    connectionLimit: 10,
    connectTimeout: 2000,
    acquireTimeout: 3000,
  }
}

/** Cliente Prisma único del proceso, sobre el driver nativo de MariaDB. */
export const prisma = new PrismaClient({ adapter: new PrismaMariaDb(configuracionPool(env.DATABASE_URL)) })

const LIMITE_PING_MS = 2000

/**
 * Comprueba que la base de datos responde. Lanza un error si no hay conexión o si
 * tarda más de LIMITE_PING_MS (el pool reintenta y por sí solo puede superar los 6 s).
 */
export async function pingBD(): Promise<void> {
  let temporizador: NodeJS.Timeout | undefined
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('La BD no respondió a tiempo.')), LIMITE_PING_MS)
  })
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, limite])
  } finally {
    clearTimeout(temporizador)
  }
}

export async function desconectarBD(): Promise<void> {
  await prisma.$disconnect()
}
