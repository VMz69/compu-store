import { z } from 'zod'

/**
 * Variables de entorno validadas al arrancar. Si falta o es inválida alguna,
 * el proceso termina con un mensaje que nombra la variable (nunca su valor).
 */
const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .regex(/^(mysql|mariadb):\/\/.+/, 'Debe ser una URL mysql:// o mariadb://'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((valor) =>
      valor
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean),
    ),
})

export type Env = z.infer<typeof esquemaEnv>

function cargarEnv(): Env {
  const resultado = esquemaEnv.safeParse(process.env)
  if (!resultado.success) {
    const variables = resultado.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Variables de entorno inválidas:\n- ${variables.join('\n- ')}`)
  }
  return resultado.data
}

export const env = cargarEnv()
