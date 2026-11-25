/**
 * Vincula una cuenta EXISTENTE de Firebase Auth con su Usuario en MariaDB (L03).
 * No crea ni recibe contraseñas: la cuenta se crea en la consola de Firebase y,
 * si se pide, Firebase envía el correo de restablecimiento.
 *
 * Uso:
 *   pnpm usuarios:vincular --correo <correo> --nombre "<nombre>" [--telefono <tel>]
 *                          [--rol superadmin] [--debe-cambiar] [--enviar-restablecimiento]
 */
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { env } from '../src/02-env.js'
import { desconectarBD, proveedorFirebase } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { ROLES, vincular } from '../src/05-pipeline-acceso/00-director-acceso.js'

const esquemaArgumentos = z.object({
  correo: z.email({ error: '--correo es obligatorio y debe ser un correo válido.' }).transform((correo) => correo.trim().toLowerCase()),
  nombre: z.string({ error: '--nombre es obligatorio.' }).trim().min(1, '--nombre es obligatorio.').max(80),
  telefono: z.string().trim().max(20).optional(),
  rol: z.enum(ROLES).default('superadmin'),
  'debe-cambiar': z.boolean().default(false),
  'enviar-restablecimiento': z.boolean().default(false),
})

/** Pide a Firebase que envíe su correo de restablecimiento (equivale a sendPasswordResetEmail). */
async function enviarRestablecimiento(correo: string): Promise<void> {
  if (!env.FIREBASE_WEB_API_KEY) throw new Error('Falta FIREBASE_WEB_API_KEY en api/.env para enviar el correo.')
  const respuesta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: correo }),
    },
  )
  if (!respuesta.ok) throw new Error(`Firebase no envió el correo de restablecimiento (HTTP ${respuesta.status}).`)
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      correo: { type: 'string' },
      nombre: { type: 'string' },
      telefono: { type: 'string' },
      rol: { type: 'string' },
      'debe-cambiar': { type: 'boolean' },
      'enviar-restablecimiento': { type: 'boolean' },
    },
  })
  const resultado = esquemaArgumentos.safeParse(values)
  if (!resultado.success) {
    throw new Error(resultado.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n'))
  }
  const args = resultado.data

  const firebaseUid = await proveedorFirebase.buscarPorCorreo(args.correo)
  if (!firebaseUid) throw new Error(`No existe una cuenta de Firebase con el correo ${args.correo}. Créala primero en la consola.`)

  const usuario = await vincular({
    firebaseUid,
    correo: args.correo,
    nombre: args.nombre,
    telefono: args.telefono ?? null,
    rol: args.rol,
    debeCambiarContrasena: args['debe-cambiar'],
  })
  console.log(`Usuario #${usuario.id} vinculado: ${usuario.correo} (${usuario.rol}, ${usuario.activo ? 'activo' : 'inactivo'}).`)

  if (args['enviar-restablecimiento']) {
    await enviarRestablecimiento(args.correo)
    console.log('Firebase envió el correo de restablecimiento de contraseña.')
  }
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await desconectarBD()
}
