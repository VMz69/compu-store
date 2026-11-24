import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'

/** Deja la BD de pruebas vacía respetando las FK (imágenes, especificaciones y lotes caen en cascada). */
async function vaciarBD() {
  await prisma.movimientoInventario.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.categoria.deleteMany()
  await prisma.marca.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.configuracionTienda.deleteMany()
}

describe('Seed de la Fase A', () => {
  beforeAll(vaciarBD)
  afterAll(async () => {
    await desconectarBD()
  })

  it('crea el catálogo completo desde una BD vacía', async () => {
    const resumen = await sembrar(prisma)

    expect(resumen).toEqual({ categorias: 5, marcas: 8, productos: 12, configuracion: 1 })
    const ids = (await prisma.producto.findMany({ select: { id: true }, orderBy: { id: 'asc' } })).map((p) => p.id)
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('es idempotente: una segunda ejecución no crea ni duplica nada', async () => {
    const resumen = await sembrar(prisma)

    expect(resumen).toEqual({ categorias: 0, marcas: 0, productos: 0, configuracion: 0 })
    expect(await prisma.producto.count()).toBe(12)
    expect(await prisma.imagenProducto.count()).toBe(53)
    expect(await prisma.movimientoInventario.count()).toBe(12)
  })

  it('no sobrescribe lo editado desde el admin', async () => {
    await prisma.producto.update({ where: { id: 1 }, data: { precio: '499.99' } })

    await sembrar(prisma)

    const producto = await prisma.producto.findUniqueOrThrow({ where: { id: 1 } })
    expect(producto.precio.toFixed(2)).toBe('499.99')
  })

  it('con control de lotes, stock = Σ lotes (D-16)', async () => {
    const producto = await prisma.producto.findUniqueOrThrow({ where: { sku: 'SAM-980-1TB' }, include: { lotes: true } })

    expect(producto.controlLotes).toBe(true)
    expect(producto.stock).toBe(producto.lotes.reduce((suma, lote) => suma + lote.cantidad, 0))
  })

  it('el stock de cada producto coincide con la suma de sus movimientos de carga inicial', async () => {
    const productos = await prisma.producto.findMany({ include: { movimientos: true } })

    for (const producto of productos) {
      const suma = producto.movimientos.reduce((total, m) => total + m.delta, 0)
      expect(suma, producto.sku).toBe(producto.stock)
      expect(producto.movimientos.every((m) => m.usuarioId === null)).toBe(true)
    }
  })

  it('guarda el dinero como DECIMAL(12,2) y la portada en orden 0', async () => {
    const producto = await prisma.producto.findUniqueOrThrow({
      where: { sku: 'LOG-M185-GR' },
      include: { imagenes: { orderBy: { orden: 'asc' } } },
    })

    expect(producto.costo?.toFixed(2)).toBe('12.50')
    expect(producto.tasaIva.toFixed(2)).toBe('13.00')
    expect(producto.imagenes[0]?.url).toContain('Mouse+Logitech+M185')
  })

  it('el nombre de categoría es único sin distinguir acentos ni mayúsculas', async () => {
    await expect(
      prisma.categoria.create({ data: { slug: 'audio-2', nombre: 'ÁUDIO', icono: 'x', descripcion: 'x' } }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('la base rechaza stock negativo (UNSIGNED)', async () => {
    await expect(prisma.producto.update({ where: { id: 8 }, data: { stock: { decrement: 1 } } })).rejects.toThrow()
  })
})
