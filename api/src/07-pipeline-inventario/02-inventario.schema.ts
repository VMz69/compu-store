import { z } from 'zod'

const LIMITE = 1_000_000

export const esquemaIdProducto = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

/** Ajuste rápido ±n (stepper del admin). El motivo lo genera el servidor según el origen. */
export const esquemaAjuste = z.strictObject({
  delta: z
    .number()
    .int('Debe ser un entero.')
    .min(-LIMITE)
    .max(LIMITE)
    .refine((delta) => delta !== 0, 'El ajuste no puede ser 0.'),
})

const cantidad = z.number().int('Debe ser un entero.').min(0, 'Ingresa 0 o más.').max(LIMITE)

/** Fecha de vencimiento `YYYY-MM-DD` (contratos-A §1) que exista en el calendario. */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.')
  .refine((valor) => new Date(`${valor}T00:00:00.000Z`).toISOString().startsWith(valor), 'Fecha no válida.')

/** Lote recibido del admin: con `id` es uno existente; sin `id`, uno nuevo. `vence: null` = no vence. */
const esquemaLote = z.strictObject({
  id: z.number().int().positive().optional(),
  numero: z.string().trim().min(1, 'El número de lote es obligatorio.').max(40, 'Máximo 40 caracteres.'),
  cantidad,
  vence: z.union([z.null(), fecha]),
})

/** Números únicos por producto, sin distinguir mayúsculas (igual que la intercalación de la BD). */
const lotes = (minimo: number) =>
  z
    .array(esquemaLote)
    .min(minimo, 'Registra al menos un lote.')
    .max(100, 'Máximo 100 lotes.')
    .refine((lista) => new Set(lista.map((l) => l.numero.toLowerCase())).size === lista.length, 'Hay números de lote repetidos.')
    .refine((lista) => new Set(lista.flatMap((l) => l.id ?? [])).size === lista.flatMap((l) => l.id ?? []).length, 'Hay lotes repetidos.')

export const esquemaLotes = lotes(1)

/**
 * Edición de existencias desde la ficha: stock manual o lotes (stock = Σ lotes, D-16).
 * `stockEsperado` es el stock que vio el admin: si cambió mientras tanto → 409.
 */
export const esquemaExistencias = z.discriminatedUnion('controlLotes', [
  z.strictObject({ controlLotes: z.literal(false), stock: cantidad, stockEsperado: cantidad }),
  z.strictObject({ controlLotes: z.literal(true), lotes: esquemaLotes, stockEsperado: cantidad }),
])

export type Ajuste = z.infer<typeof esquemaAjuste>
export type LoteRecibido = z.infer<typeof esquemaLote>
export type EdicionExistencias = z.infer<typeof esquemaExistencias>
