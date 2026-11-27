import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sembrar } from '../prisma/seed.js'
import { desconectarBD, prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { hoyNegocio } from '../src/10-pipeline-ofertas/00-director-ofertas.js'

/** Deja la BD de pruebas vacía respetando las FK (imágenes, especificaciones y lotes caen en cascada). */
async function vaciarBD() {
  await prisma.pedido.deleteMany()
  await prisma.canalVenta.deleteMany()
  await prisma.oferta.deleteMany()
  await prisma.movimientoInventario.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.categoria.deleteMany()
  await prisma.marca.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.configuracionTienda.deleteMany()
  await prisma.cliente.deleteMany()
}

describe('Seed de la Fase A', () => {
  beforeAll(vaciarBD)
  afterAll(async () => {
    await desconectarBD()
  })

  it('crea el catálogo completo desde una BD vacía', async () => {
    const resumen = await sembrar(prisma)

    expect(resumen).toEqual({ categorias: 5, marcas: 8, productos: 12, configuracion: 1, clientes: 8, ofertas: 0, canales: 4, pedidos: 0 })
    const ids = (await prisma.producto.findMany({ select: { id: true }, orderBy: { id: 'asc' } })).map((p) => p.id)
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('es idempotente: una segunda ejecución no crea ni duplica nada', async () => {
    const resumen = await sembrar(prisma)

    expect(resumen).toEqual({ categorias: 0, marcas: 0, productos: 0, configuracion: 0, clientes: 0, ofertas: 0, canales: 0, pedidos: 0 })
    expect(await prisma.producto.count()).toBe(12)
    expect(await prisma.cliente.count()).toBe(8)
    expect(await prisma.imagenProducto.count()).toBe(53)
    expect(await prisma.movimientoInventario.count()).toBe(12)
  })

  it('siembra los clientes con los ids 1–8 (CLI-001…008) y el teléfono normalizado', async () => {
    const clientes = await prisma.cliente.findMany({ orderBy: { id: 'asc' } })
    expect(clientes.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(clientes[0]).toMatchObject({ nombre: 'María Hernández', telefonoNormalizado: '74889922', documento: '04512378-9' })
    expect(clientes[7]?.activo).toBe(false)
  })

  it('sin demo no siembra ofertas; con demo siembra 3 (vigente, programada y vencida), idempotente', async () => {
    expect(await prisma.oferta.count()).toBe(0)
    const hoy = hoyNegocio()
    expect((await sembrar(prisma, { demo: true })).ofertas).toBe(3)
    expect((await sembrar(prisma, { demo: true })).ofertas).toBe(0)

    const ofertas = await prisma.oferta.findMany({ orderBy: { id: 'asc' }, include: { productos: { orderBy: { productoId: 'asc' } } } })
    const texto = (fecha: Date) => fecha.toISOString().slice(0, 10)
    expect(ofertas.map((o) => o.id)).toEqual([1, 2, 3])
    const [vigente, programada, vencida] = ofertas
    expect(texto(vigente!.inicio) < hoy && texto(vigente!.fin) > hoy).toBe(true)
    expect(vigente!.productos.map((p) => p.productoId)).toEqual([6, 10])
    expect(texto(programada!.inicio) > hoy).toBe(true)
    expect(texto(vencida!.fin) < hoy).toBe(true)
    expect(vencida).toMatchObject({ tipoDescuento: 'monto', pausada: false })
    expect(vencida!.valor.toFixed(2)).toBe('25.00')

    // El resto de suites parte sin ofertas.
    await prisma.oferta.deleteMany()
  })

  it('siembra los 4 canales siempre y, con demo, los pedidos 2 y 3 (Reservado), 4 (Registrado) y 6 (Cancelado), idempotente', async () => {
    const canales = await prisma.canalVenta.findMany({ orderBy: { id: 'asc' } })
    expect(canales.map((c) => c.nombre)).toEqual(['Sala de Ventas', 'WhatsApp', 'Tienda Web', 'Corporativo'])
    // La prueba anterior ya sembró con demo; se parte de cero para contar (borrar a mano no libera reservas).
    await prisma.pedido.deleteMany()
    await prisma.producto.updateMany({ data: { reservado: 0 } })

    expect((await sembrar(prisma, { demo: true })).pedidos).toBe(4)
    expect((await sembrar(prisma, { demo: true })).pedidos).toBe(0)

    const pedidos = await prisma.pedido.findMany({ orderBy: { id: 'asc' }, include: { lineas: true, cargos: true, historial: true } })
    expect(pedidos.map((p) => [p.id, p.estado])).toEqual([[2, 'confirmado'], [3, 'confirmado'], [4, 'registrado'], [6, 'cancelado']])
    const [whatsapp, web, corporativo, cancelado] = pedidos

    // L14: reservados con la operación real (hoy + 11 y hoy + 9); la segunda ejecución no reserva de nuevo.
    const fecha = (dias: number) => {
      const f = new Date(`${hoyNegocio()}T00:00:00.000Z`)
      f.setUTCDate(f.getUTCDate() + dias)
      return f.toISOString().slice(0, 10)
    }
    expect(whatsapp!.reservadoHasta?.toISOString().slice(0, 10)).toBe(fecha(11))
    expect(web!.reservadoHasta?.toISOString().slice(0, 10)).toBe(fecha(9))
    expect(whatsapp!.historial.map((e) => [e.estado, e.por])).toEqual([['registrado', 'Gabriela Solís'], ['confirmado', 'Gabriela Solís']])
    expect(web!.total.toFixed(2)).toBe('93.50')
    const reservados = await prisma.producto.findMany({ where: { reservado: { gt: 0 } }, orderBy: { id: 'asc' }, select: { id: true, reservado: true } })
    expect(reservados).toEqual([{ id: 3, reservado: 1 }, { id: 4, reservado: 1 }, { id: 6, reservado: 1 }])
    // 799 × 2 × 95 % = 1518.10 + envío 8.00
    expect(corporativo!.lineas[0]!.importe.toFixed(2)).toBe('1518.10')
    expect(corporativo!.total.toFixed(2)).toBe('1526.10')
    expect(corporativo).toMatchObject({ clienteNombre: 'Empresa Consultores SV', canalNombre: 'Corporativo' })
    expect(cancelado!.total.toFixed(2)).toBe('90.00')
    expect(cancelado!.historial.map((e) => e.estado)).toEqual(['registrado', 'cancelado'])

    // El resto de suites parte sin pedidos ni reservas (los canales se quedan).
    await prisma.oferta.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.producto.updateMany({ data: { reservado: 0 } })
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
