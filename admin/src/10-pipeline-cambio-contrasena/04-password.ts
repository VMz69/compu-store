/**
 * Utilidades de contraseñas para el modo mocking-first.
 *
 * ⚠️ IMPORTANTE (para la integración con API real):
 * En producción el navegador NUNCA debe hashear ni almacenar contraseñas.
 * El front envía la contraseña por HTTPS al backend, que la guarda con un
 * algoritmo lento y con sal (bcrypt / argon2id). Este archivo existe solo para
 * que el demo no guarde contraseñas en texto plano en localStorage, y su
 * contrato (hash / verify / policy) se puede reemplazar por llamadas a la API.
 *
 * Formato del hash: "sha256$<sal hex 16>$<digest hex 64>"
 * Digest = SHA-256( `${sal}:${contraseña}` )
 */

export const PASSWORD_MIN_LENGTH = 8

const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')

const randomHex = (byteCount: number): string => {
  const bytes = new Uint8Array(byteCount)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

async function digest(salt: string, password: string): Promise<string> {
  // `crypto.subtle` solo existe en contextos seguros (HTTPS o localhost).
  if (!crypto.subtle) {
    throw new Error('El cifrado requiere HTTPS. Abre el panel con https:// o desde localhost.')
  }
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

/** Genera el hash con una sal aleatoria nueva. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(8)
  return `sha256$${salt}$${await digest(salt, password)}`
}

/** Compara la contraseña ingresada contra el hash almacenado. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, expected] = storedHash.split('$')
  if (algorithm !== 'sha256' || !salt || !expected) return false
  return (await digest(salt, password)) === expected
}

/* ------------------------------------------------------------------ */
/* Política de contraseñas                                             */
/* ------------------------------------------------------------------ */

export interface PasswordCheck {
  id: 'length' | 'lower' | 'upper' | 'number' | 'symbol'
  label: string
  passed: boolean
}

/**
 * Reglas visibles en el formulario. Las 4 primeras son obligatorias;
 * el símbolo solo suma fortaleza.
 */
export function checkPassword(password: string) {
  const checks: PasswordCheck[] = [
    { id: 'length', label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, passed: password.length >= PASSWORD_MIN_LENGTH },
    { id: 'lower', label: 'Una minúscula', passed: /[a-z]/.test(password) },
    { id: 'upper', label: 'Una mayúscula', passed: /[A-Z]/.test(password) },
    { id: 'number', label: 'Un número', passed: /\d/.test(password) },
    { id: 'symbol', label: 'Un símbolo (recomendado)', passed: /[^A-Za-z0-9]/.test(password) },
  ]
  const required = checks.filter((c) => c.id !== 'symbol')
  return {
    checks,
    isValid: required.every((c) => c.passed),
    /** 0–5: cantidad de reglas cumplidas (para la barra de fortaleza). */
    score: checks.filter((c) => c.passed).length,
  }
}

const CHARSETS = {
  lower: 'abcdefghijkmnpqrstuvwxyz', // sin "l" ni "o" (se confunden con 1 y 0)
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%&*?',
}

const pick = (set: string): string => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length]

/** Contraseña temporal aleatoria que cumple la política (12 caracteres). */
export function generatePassword(length = 12): string {
  const all = Object.values(CHARSETS).join('')
  const chars = [pick(CHARSETS.lower), pick(CHARSETS.upper), pick(CHARSETS.digits), pick(CHARSETS.symbols)]
  while (chars.length < length) chars.push(pick(all))
  // Mezcla Fisher–Yates para que los obligatorios no queden siempre al inicio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
