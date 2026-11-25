import { z } from 'zod'

/** Mismo patrón que el admin (`20-pipeline-validacion-producto/02-productValidation.ts`). */
const SKU = /^[A-Z0-9][A-Z0-9-]{1,31}$/

/** Dinero como string decimal (D-05), hasta DECIMAL(12,2). */
const dinero = z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Importe no válido (ej. "525.00").')
const dineroOpcional = z.union([z.literal(''), z.null(), dinero]).transform((valor) => valor || null)

/** IVA como porcentaje (D-05), de 0 a 100. */
const porcentaje = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Porcentaje no válido (ej. "13.00").')
  .refine((valor) => Number(valor) <= 100, 'Entre 0 y 100.')

/** SKU opcional: vacío o null = automático (`PRD-###`). Se guarda en mayúsculas. */
const sku = z
  .union([z.literal(''), z.null(), z.string().trim().toUpperCase().regex(SKU, 'Usa letras, números y guiones (2–32 caracteres).')])
  .transform((valor) => valor || null)

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/, 'Slug no válido.')
const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`)
const cantidad = z.number().int('Debe ser un entero.').min(0, 'Ingresa 0 o más.').max(1_000_000)

const especificacion = z.strictObject({
  clave: z.string().trim().min(1, 'La clave es obligatoria.').max(60, 'Máximo 60 caracteres.'),
  valor: z.string().trim().min(1, 'El valor es obligatorio.').max(200, 'Máximo 200 caracteres.'),
})

export const MAX_IMAGENES = 8

/** URLs absolutas http(s); los data URL se suben antes con POST /admin/imagenes. */
const imagenes = z
  .array(z.string().trim().max(500, 'URL demasiado larga.').regex(/^https?:\/\/\S+$/i, 'Solo URLs http(s).'))
  .max(MAX_IMAGENES, `Máximo ${MAX_IMAGENES} imágenes por producto.`)
  .refine((urls) => new Set(urls).size === urls.length, 'Hay imágenes repetidas en la galería.')

/** Campos editables comunes a alta y edición (contratos-A §4.2). */
const campos = {
  sku,
  nombre: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
  categoria: slug,
  marca: slug,
  modelo: texto(80),
  condicion: z.enum(['nuevo', 'usado', 'reacondicionado']),
  costo: dineroOpcional,
  precio: dinero.refine((valor) => Number(valor) > 0, 'El precio de venta debe ser mayor a 0.'),
  precioAnterior: dineroOpcional,
  tasaIva: porcentaje,
  puntoReorden: cantidad,
  publicado: z.boolean(),
  descripcion: texto(5000),
  compatibilidad: texto(5000),
  conectividad: texto(5000),
  especificaciones: z.array(especificacion).max(50, 'Máximo 50 especificaciones.'),
  imagenes,
}

export const esquemaIdProducto = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

/** Alta: además acepta el stock inicial (se registra como movimiento). Los lotes llegan en L06. */
export const esquemaCrearProducto = z.strictObject({
  ...campos,
  sku: campos.sku.default(null),
  modelo: campos.modelo.default(''),
  condicion: campos.condicion.default('nuevo'),
  costo: campos.costo.default(null),
  precioAnterior: campos.precioAnterior.default(null),
  tasaIva: campos.tasaIva.default('13.00'),
  puntoReorden: campos.puntoReorden.default(3),
  publicado: campos.publicado.default(true),
  descripcion: campos.descripcion.default(''),
  compatibilidad: campos.compatibilidad.default(''),
  conectividad: campos.conectividad.default(''),
  especificaciones: campos.especificaciones.default([]),
  imagenes: campos.imagenes.default([]),
  stock: cantidad.default(0),
})

/** Edición parcial: stock, lotes y control por lotes se gestionan en el inventario (L06). */
export const esquemaEditarProducto = z.strictObject({
  sku: campos.sku.optional(),
  nombre: campos.nombre.optional(),
  categoria: campos.categoria.optional(),
  marca: campos.marca.optional(),
  modelo: campos.modelo.optional(),
  condicion: campos.condicion.optional(),
  costo: campos.costo.optional(),
  precio: campos.precio.optional(),
  precioAnterior: campos.precioAnterior.optional(),
  tasaIva: campos.tasaIva.optional(),
  puntoReorden: campos.puntoReorden.optional(),
  publicado: campos.publicado.optional(),
  descripcion: campos.descripcion.optional(),
  compatibilidad: campos.compatibilidad.optional(),
  conectividad: campos.conectividad.optional(),
  especificaciones: campos.especificaciones.optional(),
  imagenes: campos.imagenes.optional(),
})

export const esquemaPublicado = z.strictObject({ publicado: z.boolean() })

export const esquemaIdImagen = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export type CrearProducto = z.infer<typeof esquemaCrearProducto>
export type EditarProducto = z.infer<typeof esquemaEditarProducto>
