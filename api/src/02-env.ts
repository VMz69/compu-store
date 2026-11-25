import { z } from 'zod'

/**
 * Variables de entorno validadas al arrancar. Si falta o es inválida alguna,
 * el proceso termina con un mensaje que nombra la variable (nunca su valor).
 */
/** Variable opcional: una línea `CLAVE=` vacía (como en .env.example) cuenta como ausente. */
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.preprocess((valor) => (valor === '' ? undefined : valor), esquema.optional())

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
  // Admin SDK de Firebase (D-01), extraídas del JSON de la cuenta de servicio (ver README).
  // Opcionales aquí para que seed y scripts de BD funcionen sin ellas; la API las exige al arrancar.
  FIREBASE_PROJECT_ID: opcional(z.string()),
  FIREBASE_CLIENT_EMAIL: opcional(z.email()),
  // Admite los \n literales (comillas simples o paneles como Railway) además de saltos reales.
  FIREBASE_PRIVATE_KEY: opcional(z.string().transform((valor) => valor.replace(/\\n/g, '\n'))),
  /** Clave web pública: solo la usa el script de vinculación para enviar el correo de restablecimiento. */
  FIREBASE_WEB_API_KEY: opcional(z.string()),
  // Cloudinary (D-17): imágenes de productos. Opcionales aquí (seed, scripts y pruebas); la API las exige al arrancar.
  CLOUDINARY_CLOUD_NAME: opcional(z.string()),
  CLOUDINARY_API_KEY: opcional(z.string()),
  CLOUDINARY_API_SECRET: opcional(z.string()),
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
