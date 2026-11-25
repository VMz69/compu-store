import { z } from 'zod'

/** Slug igual al del admin (`admin/src/85-pipeline-identificadores-texto/01-text.ts`). */
export const slugify = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const ICONO_CATEGORIA_POR_DEFECTO = 'fa-solid fa-folder'

const icono = z.string().trim().regex(/^fa-(solid|regular|brands) fa-[a-z0-9-]{1,40}$/, 'Ícono no válido (ej. "fa-solid fa-laptop").')
const descripcion = z.string().trim().max(160, 'Máximo 160 caracteres.')

const nombreCategoria = z
  .string()
  .trim()
  .min(3, 'Mínimo 3 caracteres.')
  .max(40, 'Máximo 40 caracteres.')
  .refine((nombre) => slugify(nombre) !== '', 'Usa al menos una letra o número.')

const nombreMarca = z.string().trim().min(2, 'Mínimo 2 caracteres.').max(40, 'Máximo 40 caracteres.')

/** Mismo patrón que `validateBrand` del admin; vacío o null = sin sitio web. */
const sitioWeb = z
  .union([
    z.literal(''),
    z.null(),
    z.string().trim().max(200).regex(/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i, 'URL no válida (ej. https://www.hp.com).'),
  ])
  .transform((valor) => valor || null)

export const esquemaSlug = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,60}$/, 'Slug no válido.') })

export const esquemaCrearCategoria = z.strictObject({
  nombre: nombreCategoria,
  icono: icono.default(ICONO_CATEGORIA_POR_DEFECTO),
  descripcion: descripcion.default(''),
})
export const esquemaEditarCategoria = z.strictObject({
  nombre: nombreCategoria.optional(),
  icono: icono.optional(),
  descripcion: descripcion.optional(),
})

export const esquemaCrearMarca = z.strictObject({
  nombre: nombreMarca,
  sitioWeb: sitioWeb.default(null),
  descripcion: descripcion.default(''),
  activa: z.boolean().default(true),
})
export const esquemaEditarMarca = z.strictObject({
  nombre: nombreMarca.optional(),
  sitioWeb: sitioWeb.optional(),
  descripcion: descripcion.optional(),
  activa: z.boolean().optional(),
})

export const esquemaActivarMarca = z.strictObject({ activa: z.boolean() })

export type CrearCategoria = z.infer<typeof esquemaCrearCategoria>
export type EditarCategoria = z.infer<typeof esquemaEditarCategoria>
export type CrearMarca = z.infer<typeof esquemaCrearMarca>
export type EditarMarca = z.infer<typeof esquemaEditarMarca>
