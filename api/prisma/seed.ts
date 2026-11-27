/**
 * Seed reproducible de la Fase A (L02). Transcribe los mocks de los frontends
 * (contratos-A.md §8): el admin es la fuente; del store se toman el icono de las marcas,
 * las imágenes adicionales y la identidad pública. No crea usuarios ni contraseñas.
 *
 * Idempotente y no destructivo: solo crea lo que falta (por slug, sku o id) y nunca
 * sobrescribe lo editado desde el admin.
 *
 * Uso: `pnpm db:sembrar` (prisma db seed). En pruebas se importa `sembrar`.
 * Con `SEED_DEMO=true` también siembra las ofertas de demostración (L12), con fechas
 * relativas al día de la ejecución para que no venzan, y los pedidos de demostración (L13; los
 * reservados de L14 se reservan con la misma operación que la API):
 * `SEED_DEMO=true pnpm db:sembrar`.
 */
import { resolve } from 'node:path'
import type { CondicionProducto, PrismaClient } from '../generated/prisma/client.js'

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

const CREADA_EN = new Date('2026-10-01T09:00:00.000Z')
const MOTIVO_CARGA_INICIAL = 'Carga inicial (seed)'

// ── Taxonomía ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { slug: 'computadoras', nombre: 'Computadoras', icono: 'fa-solid fa-laptop', descripcion: 'Laptops empresariales, equipos de oficina y alto rendimiento.' },
  { slug: 'audio', nombre: 'Audio', icono: 'fa-solid fa-headphones', descripcion: 'Audífonos gamers, bocinas inalámbricas y micrófonos con filtro.' },
  { slug: 'gaming', nombre: 'Gaming', icono: 'fa-solid fa-gamepad', descripcion: 'Teclados mecánicos RGB, mouses ópticos y sillas ergonómicas.' },
  { slug: 'componentes', nombre: 'Componentes', icono: 'fa-solid fa-microchip', descripcion: 'Memorias RAM, discos sólidos NVMe y monitores IPS.' },
  { slug: 'accesorios', nombre: 'Accesorios', icono: 'fa-solid fa-plug', descripcion: 'Bases refrigerantes, webcams FHD, cables y adaptadores.' },
]

const MARCAS = [
  { slug: 'acer', nombre: 'Acer', sitioWeb: 'https://www.acer.com', descripcion: 'Laptops y equipos de oficina.', icono: 'fa-solid fa-laptop' },
  { slug: 'dell', nombre: 'Dell', sitioWeb: 'https://www.dell.com', descripcion: 'Equipos empresariales y monitores.', icono: 'fa-solid fa-desktop' },
  { slug: 'hp', nombre: 'HP', sitioWeb: 'https://www.hp.com', descripcion: 'Laptops, impresoras y accesorios.', icono: 'fa-solid fa-laptop-code' },
  { slug: 'jbl', nombre: 'JBL', sitioWeb: 'https://www.jbl.com', descripcion: 'Audio: bocinas y audífonos.', icono: 'fa-solid fa-headphones' },
  { slug: 'kingston', nombre: 'Kingston', sitioWeb: 'https://www.kingston.com', descripcion: 'Memorias RAM y almacenamiento.', icono: 'fa-solid fa-memory' },
  { slug: 'logitech', nombre: 'Logitech', sitioWeb: 'https://www.logitech.com', descripcion: 'Periféricos y webcams.', icono: 'fa-solid fa-computer-mouse' },
  { slug: 'redragon', nombre: 'Redragon', sitioWeb: 'https://www.redragonzone.com', descripcion: 'Periféricos gamer.', icono: 'fa-solid fa-gamepad' },
  { slug: 'samsung', nombre: 'Samsung', sitioWeb: 'https://www.samsung.com', descripcion: 'Discos SSD, monitores y memorias.', icono: 'fa-solid fa-microchip' },
]

// ── Productos ──────────────────────────────────────────────────────────────

/** Imagen del admin (galería principal). */
const img = (texto: string) => `https://placehold.co/400x300/f8fafc/0168f5?text=${texto}`

/** Las 3 vistas adicionales que muestra el store para cada producto. */
const extrasStore = (texto: string) => [
  `https://placehold.co/800x600/eef5ff/0047b3?text=${texto}+-+Vista+lateral`,
  `https://placehold.co/800x600/e2e8f0/0c192c?text=${texto}+-+Detalle`,
  `https://placehold.co/800x600/dbeafe/0168f5?text=${texto}+-+Empaque`,
]

interface ProductoSeed {
  id: number
  sku: string
  slug: string
  nombre: string
  categoria: string
  marca: string
  modelo: string
  condicion: CondicionProducto
  costo: string | null
  precio: string
  precioAnterior: string | null
  stock: number
  puntoReorden?: number
  etiqueta: string | null
  imagenes: string[]
  descripcion: string
  compatibilidad: string
  conectividad: string
  especificaciones: [string, string][]
  lotes?: { numero: string; cantidad: number }[]
}

const PRODUCTOS: ProductoSeed[] = [
  {
    id: 1, sku: 'ACR-A515-REF', slug: 'laptop-acer-aspire-5-refurbished', nombre: 'Laptop Acer Aspire 5 Refurbished',
    categoria: 'computadoras', marca: 'acer', modelo: 'Aspire 5 A515-56', condicion: 'reacondicionado',
    costo: '395.00', precio: '525.00', precioAnterior: '600.00', stock: 1, etiqueta: 'Destacado',
    imagenes: [img('Laptop+Acer+Aspire'), img('Acer+Teclado+Retroiluminado'), img('Acer+Puertos+Laterales'), img('Acer+Vista+Trasera'), ...extrasStore('Laptop+Acer+Aspire')],
    descripcion: 'Laptop reacondicionada clase A, ideal para trabajo de oficina, programación y multitarea exigente. Pantalla 15.6 pulgadas Full HD.',
    compatibilidad: 'Windows 11 Pro, Office 365, Linux (Ubuntu 22.04+).',
    conectividad: 'Wi-Fi 6, Bluetooth 5.1, USB-C, 2× USB-A 3.2, HDMI 1.4, RJ-45.',
    especificaciones: [['Procesador', 'Intel Core i5 11va Gen'], ['Memoria', '8 GB RAM DDR4'], ['Almacenamiento', '256 GB SSD NVMe M.2'], ['Pantalla', '15.6" FHD']],
  },
  {
    id: 2, sku: 'DEL-SE2422H', slug: 'monitor-dell-24-ips-fhd', nombre: 'Monitor Dell 24 pulg. IPS FHD 75Hz',
    categoria: 'componentes', marca: 'dell', modelo: 'SE2422H', condicion: 'nuevo',
    costo: '185.00', precio: '250.00', precioAnterior: '300.00', stock: 4, etiqueta: 'Oferta',
    imagenes: [img('Monitor+Dell+24+IPS'), img('Dell+Bisel+Ultrafino'), img('Dell+Puertos+HDMI+VGA'), ...extrasStore('Monitor+Dell+24+IPS')],
    descripcion: 'Pantalla IPS antirreflejo de bisel ultrafino con excelente precisión de color sRGB y conectividad HDMI/VGA.',
    compatibilidad: 'PC de escritorio, laptops y consolas con salida HDMI o VGA.',
    conectividad: 'HDMI 1.4, VGA.',
    especificaciones: [['Resolución', '1920×1080 FHD'], ['Panel', 'IPS 75 Hz'], ['Tecnología', 'ComfortView']],
  },
  {
    id: 3, sku: 'SAM-980-1TB', slug: 'disco-m2-1tb-samsung-nvme', nombre: 'Disco M.2 1 TB SAMSUNG NVMe 980',
    categoria: 'componentes', marca: 'samsung', modelo: '980 MZ-V8V1T0', condicion: 'nuevo',
    costo: '52.00', precio: '75.00', precioAnterior: null, stock: 7, etiqueta: null,
    imagenes: [img('Disco+M2+Samsung+1TB'), ...extrasStore('Disco+M2+Samsung+1TB')],
    descripcion: 'Unidad de estado sólido NVMe PCIe 3.0 con velocidades de lectura secuencial de hasta 3,500 MB/s.',
    compatibilidad: 'Placas con ranura M.2 2280 (M-Key) PCIe 3.0/4.0.',
    conectividad: 'PCIe 3.0 ×4, NVMe 1.4.',
    especificaciones: [['Capacidad', '1 TB'], ['Lectura', '3,500 MB/s'], ['Formato', 'M.2 2280']],
    lotes: [{ numero: 'L-24A', cantidad: 4 }, { numero: 'L-24C', cantidad: 3 }],
  },
  {
    id: 4, sku: 'RDG-K552-RGB', slug: 'teclado-mecanico-rgb-redragon', nombre: 'Teclado Mecánico RGB Redragon Gamer',
    categoria: 'gaming', marca: 'redragon', modelo: 'Kumara K552', condicion: 'nuevo',
    costo: '38.00', precio: '60.00', precioAnterior: '75.00', stock: 2, etiqueta: 'Oferta',
    imagenes: [img('Teclado+RGB+Gamer'), ...extrasStore('Teclado+RGB+Gamer')],
    descripcion: 'Teclado mecánico con switches táctiles Outemu Blue y retroiluminación RGB dinámica configurable.',
    compatibilidad: 'Windows, macOS y Linux.',
    conectividad: 'USB-A cableado.',
    especificaciones: [['Switches', 'Outemu Blue'], ['Iluminación', 'RGB 16.8M colores'], ['Distribución', 'Español']],
  },
  {
    id: 5, sku: 'LOG-M185-GR', slug: 'mouse-inalambrico-logitech-m185', nombre: 'Mouse Inalámbrico Logitech M185',
    categoria: 'accesorios', marca: 'logitech', modelo: 'M185', condicion: 'nuevo',
    costo: '12.50', precio: '20.00', precioAnterior: null, stock: 10, etiqueta: null,
    imagenes: [img('Mouse+Logitech+M185'), ...extrasStore('Mouse+Logitech+M185')],
    descripcion: 'Mouse compacto y confiable con nano receptor inalámbrico de 2.4 GHz y 12 meses de autonomía.',
    compatibilidad: 'Windows, macOS, ChromeOS y Linux.',
    conectividad: 'Inalámbrico 2.4 GHz, nano receptor USB.',
    especificaciones: [['Sensor', '1000 DPI'], ['Batería', 'AA incluida']],
  },
  {
    id: 6, sku: 'RDG-H510-71', slug: 'audifonos-gaming-diadema-7-1', nombre: 'Audífonos Gaming Diadema 7.1 Surround',
    categoria: 'audio', marca: 'redragon', modelo: 'Zeus H510', condicion: 'nuevo',
    costo: '29.00', precio: '45.00', precioAnterior: '55.00', stock: 2, etiqueta: 'Últimos',
    imagenes: [img('Audifonos+Gamer+7.1'), ...extrasStore('Audifonos+Diadema+7.1')],
    descripcion: 'Sonido envolvente 7.1 virtual con controladores de 53mm y micrófono con cancelación de ruido.',
    compatibilidad: 'PC, PS4/PS5 (estéreo).',
    conectividad: 'USB-A; adaptador 3.5 mm.',
    especificaciones: [['Audio', '7.1 Virtual'], ['Drivers', '53 mm'], ['Micrófono', 'Con cancelación de ruido']],
  },
  {
    id: 7, sku: 'RDG-CP-ALU', slug: 'base-enfriadora-laptop-aluminio', nombre: 'Base Enfriadora para Laptop de Aluminio',
    categoria: 'accesorios', marca: 'redragon', modelo: 'Coolpad Alu', condicion: 'nuevo',
    costo: '10.00', precio: '18.00', precioAnterior: null, stock: 15, puntoReorden: 5, etiqueta: null,
    imagenes: [img('Base+Enfriadora+Aluminio'), ...extrasStore('Soporte+Metalico+Laptop')],
    descripcion: 'Soporte ergonómico ajustable con 6 niveles de inclinación y aleación de aluminio termorresistente.',
    compatibilidad: 'Laptops de 10 a 16 pulgadas.',
    conectividad: 'Alimentación USB-A.',
    especificaciones: [['Material', 'Aleación de aluminio'], ['Niveles', '6 alturas']],
  },
  {
    id: 8, sku: 'LOG-C920-FHD', slug: 'webcam-full-hd-1080p', nombre: 'Webcam Full HD 1080p con Micrófono',
    categoria: 'accesorios', marca: 'logitech', modelo: 'C920', condicion: 'nuevo',
    costo: '22.00', precio: '35.00', precioAnterior: null, stock: 0, etiqueta: 'Agotado',
    imagenes: [img('Webcam+Full+HD+1080p'), ...extrasStore('Webcam+Full+HD+1080p')],
    descripcion: 'Cámara web con lente de cristal Full HD y micrófono estéreo con reducción de ruido ambiental.',
    compatibilidad: 'Zoom, Teams, Meet; Windows y macOS.',
    conectividad: 'USB-A 2.0.',
    especificaciones: [['Video', '1080p a 30 FPS'], ['Audio', 'Micrófono estéreo']],
  },
  {
    id: 9, sku: 'HP-450G8-I5', slug: 'laptop-hp-probook-450-g8', nombre: 'Laptop HP ProBook 450 G8 Core i5',
    categoria: 'computadoras', marca: 'hp', modelo: 'ProBook 450 G8', condicion: 'nuevo',
    costo: '610.00', precio: '799.00', precioAnterior: '850.00', stock: 3, etiqueta: 'Destacado',
    imagenes: [img('HP+ProBook+450+G8'), ...extrasStore('HP+ProBook+450+G8')],
    descripcion: 'Potencia corporativa en chasis de aluminio pulido. Seguridad TPM 2.0 y excelente autonomía.',
    compatibilidad: 'Windows 11 Pro, dominios corporativos (TPM 2.0).',
    conectividad: 'Wi-Fi 6, Bluetooth 5.2, Thunderbolt 4, HDMI 2.0, RJ-45.',
    especificaciones: [['Procesador', 'Intel Core i5-1135G7'], ['Memoria', '16 GB RAM DDR4'], ['Almacenamiento', '512 GB SSD NVMe'], ['Pantalla', '15.6" FHD IPS']],
  },
  {
    id: 10, sku: 'JBL-T500BT', slug: 'audifonos-inalambricos-jbl-pure-bass', nombre: 'Audífonos Inalámbricos JBL Pure Bass',
    categoria: 'audio', marca: 'jbl', modelo: 'Tune 500BT', condicion: 'nuevo',
    costo: '32.00', precio: '49.00', precioAnterior: null, stock: 5, etiqueta: null,
    imagenes: [img('JBL+Pure+Bass+BT'), ...extrasStore('JBL+Pure+Bass+BT')],
    descripcion: 'Sonido legendario JBL Pure Bass con Bluetooth 5.0 y hasta 40 horas continuas de batería.',
    compatibilidad: 'Android, iOS, Windows y macOS.',
    conectividad: 'Bluetooth 5.0, carga USB-C.',
    especificaciones: [['Batería', '40 horas'], ['Carga', 'Rápida USB-C']],
  },
  {
    id: 11, sku: 'KNG-FB16-3200', slug: 'memoria-ram-kingston-fury-16gb', nombre: 'Memoria RAM Kingston Fury Beast 16GB DDR4',
    categoria: 'componentes', marca: 'kingston', modelo: 'KF432C16BB/16', condicion: 'nuevo',
    costo: '31.00', precio: '45.00', precioAnterior: '52.00', stock: 8, etiqueta: 'Oferta',
    imagenes: [img('RAM+Kingston+16GB'), ...extrasStore('RAM+Kingston+16GB')],
    descripcion: 'Módulo de alto rendimiento para gaming y diseño. Disipador térmico negro de perfil bajo.',
    compatibilidad: 'Placas DDR4 de escritorio (DIMM); Intel XMP / AMD Ryzen.',
    conectividad: 'DIMM 288 pines.',
    especificaciones: [['Capacidad', '16 GB'], ['Velocidad', '3200 MHz CL16']],
  },
  {
    id: 12, sku: 'RDG-GC-RECL', slug: 'silla-gamer-ergonomica-reclinable', nombre: 'Silla Gamer Ergonómica Reclinable',
    categoria: 'gaming', marca: 'redragon', modelo: 'Gaia C211', condicion: 'nuevo',
    costo: '128.00', precio: '185.00', precioAnterior: '220.00', stock: 2, etiqueta: 'Oferta',
    imagenes: [img('Silla+Gamer+Ergonomica'), ...extrasStore('Silla+Gamer+Ergonomica')],
    descripcion: 'Comodidad suprema para largas sesiones de trabajo o juego con cojines lumbar y cervical incluidos.',
    compatibilidad: 'Usuarios de hasta 150 kg.',
    conectividad: 'No aplica.',
    especificaciones: [['Reclinación', '150°'], ['Pistón', 'Gas Clase 4']],
  },
]

// ── Identidad pública (store/src/01-pipeline-identidad-tienda/01-identidad.config.ts) ──

const CONFIGURACION = {
  nombre: 'CompuStore SV',
  eslogan: 'COMPUTADORAS Y ACCESORIOS',
  ciudad: 'Cojutepeque, Cuscatlán',
  pais: 'El Salvador',
  direccion: 'Frente a Dollar City, segunda planta de Farmacias Económicas, Cojutepeque, Cuscatlán, El Salvador.',
  direccionCorta: 'Frente a Dollar City, Farmacias Económicas',
  telefonos: ['7038-8225', '6838-2232'],
  whatsapp: '50370388225',
  correo: 'ventas@compustoresv.com',
  horario: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
  horarioCorto: 'Lun - Sáb: 8:00 AM - 6:00 PM',
  acercaDe:
    'CompuStore SV es la tienda tecnológica líder en Cojutepeque. Ofrecemos los mejores equipos informáticos, periféricos, audio y componentes con garantía local, asesoría personalizada y soporte técnico real.',
  mision:
    'Proveer tecnología confiable, accesible y con respaldo de garantía a profesionales, estudiantes, empresas y entusiastas del gaming en Cuscatlán y todo El Salvador.',
  vision:
    'Ser el referente de comercio electrónico tecnológico en la zona paracentral del país, combinando la cercanía del local físico con la agilidad digital.',
  valores: ['Garantía Real y Transparencia', 'Asesoría Técnica Personalizada', 'Precios Justos en USD', 'Compromiso con el Cliente'],
  redes: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    whatsapp: 'https://wa.me/50370388225',
  },
  monedaCodigo: 'USD',
  monedaSimbolo: '$',
  monedaLocale: 'en-US',
  // Emisor (L10): valores de fábrica del admin (admin/src/85-pipeline-identificadores-texto/03-store.config.ts).
  razonSocial: 'COMPU STORE SAS DE CV',
  nit: '07181607251010',
  nrc: '367628-0',
  actividadEconomica: 'Venta al por menor de computadoras y equipo periférico',
  tipoEstablecimiento: 'Casa matriz',
}

// ── Clientes (L11, admin/src/86-pipeline-datos-demo-personas/03-customers.mock.ts) ──
// Conservan los ids 1–8 (= CLI-001…008), a los que apuntan los pedidos y cotizaciones locales hasta L13/L16.

interface ClienteSeed {
  id: number
  tipo: 'persona' | 'empresa'
  nombre: string
  documento: string | null
  telefono: string
  correo: string | null
  ciudad: string
  direccion: string
  notas: string
  activo: boolean
  creadoEn: string
}

const CLIENTES: ClienteSeed[] = [
  { id: 1, tipo: 'persona', nombre: 'María Hernández', documento: '04512378-9', telefono: '7488-9922', correo: 'maria.hernandez@gmail.com', ciudad: 'Cojutepeque', direccion: 'Barrio El Centro, 3a Calle Poniente #12', notas: 'Prefiere retirar en sala de ventas.', activo: true, creadoEn: '2026-06-14T15:20:00.000Z' },
  { id: 2, tipo: 'persona', nombre: 'Carlos Henríquez', documento: '05873421-0', telefono: '6833-1100', correo: 'carlos.henriquez@outlook.com', ciudad: 'San Rafael Cedros', direccion: 'Colonia Las Flores, pasaje 4', notas: 'Cliente gamer; avisar nuevas ofertas de periféricos.', activo: true, creadoEn: '2026-07-02T10:00:00.000Z' },
  { id: 3, tipo: 'persona', nombre: 'Kevin Rodríguez', documento: null, telefono: '7012-3456', correo: 'kevin.rdz@gmail.com', ciudad: 'Cojutepeque', direccion: '', notas: '', activo: true, creadoEn: '2026-09-19T18:45:00.000Z' },
  { id: 4, tipo: 'empresa', nombre: 'Empresa Consultores SV', documento: '0614-250318-102-3', telefono: '2288-4400', correo: 'compras@consultoressv.com', ciudad: 'San Salvador', direccion: 'Edificio Torre Futura, nivel 9, Colonia Escalón', notas: 'Crédito fiscal a 30 días. Contacto: Lic. Ana Rivas.', activo: true, creadoEn: '2026-03-08T09:00:00.000Z' },
  { id: 5, tipo: 'persona', nombre: 'Gabriela Solís', documento: '03342190-5', telefono: '7654-9812', correo: null, ciudad: 'Santa Cruz Michapa', direccion: 'Cantón El Carmen', notas: '', activo: true, creadoEn: '2026-08-21T14:10:00.000Z' },
  { id: 6, tipo: 'empresa', nombre: 'Despacho Jurídico Portillo & Asociados', documento: '0702-110520-101-7', telefono: '7845-1290', correo: 'rportillo@portilloabogados.sv', ciudad: 'Cojutepeque', direccion: '2a Avenida Norte #8', notas: 'Cotizando 3 laptops HP ProBook con CCF.', activo: true, creadoEn: '2026-11-04T13:30:00.000Z' },
  { id: 7, tipo: 'persona', nombre: 'Andrea Morales', documento: null, telefono: '6120-9988', correo: 'andrea.morales@gmail.com', ciudad: 'San Pedro Perulapán', direccion: '', notas: 'Consultó compatibilidad de RAM para Dell Inspiron.', activo: true, creadoEn: '2026-11-04T12:05:00.000Z' },
  { id: 8, tipo: 'persona', nombre: 'Mauricio Gómez', documento: null, telefono: '7233-4411', correo: null, ciudad: 'Cojutepeque', direccion: '', notas: '', activo: false, creadoEn: '2026-05-30T16:00:00.000Z' },
]

// ── Ofertas de demostración (L12, solo con SEED_DEMO=true) ─────────────────
// Las 3 del mock del admin (ids 1–3 = PRM-001…003) con sus descuentos y productos. Las fechas
// son relativas al «hoy» de El Salvador del momento del seed: una vigente, una programada y una vencida.

const OFERTAS_DEMO = [
  { id: 1, titulo: 'Audífonos gamers 7.1', etiqueta: 'OFERTA ESPECIAL GAMER', descripcion: 'Sonido inmersivo y micrófono con cancelación de ruido.', productoIds: [6, 10], tipoDescuento: 'porcentaje', valor: '15', desde: -1, hasta: 30 },
  { id: 2, titulo: 'Periféricos mecánicos RGB', etiqueta: 'ZONA GAMING', descripcion: 'Teclados mecánicos y mouses ergonómicos.', productoIds: [4, 12], tipoDescuento: 'porcentaje', valor: '10', desde: 5, hasta: 20 },
  { id: 3, titulo: 'Laptops refurbished', etiqueta: 'PRODUCTIVIDAD Y ESTUDIO', descripcion: 'Equipos empresariales con garantía real.', productoIds: [1], tipoDescuento: 'monto', valor: '25', desde: -31, hasta: -1 },
] as const

/** Fecha de calendario (columna DATE) a `dias` de `hoy` (`YYYY-MM-DD`). */
const fechaRelativa = (hoy: string, dias: number) => {
  const fecha = new Date(`${hoy}T00:00:00.000Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha
}

// ── Canales de venta (L13, admin/src/88-pipeline-datos-demo-documentos/02-channels.mock.ts) ──
// Ids 1–4 en el orden del mock; siempre se siembran (los pedidos exigen un canal).

const CANALES = [
  { id: 1, nombre: 'Sala de Ventas', insignia: 'Presencial', icono: 'fa-solid fa-store', color: 'emerald', descripcion: 'Ventas y cotizaciones directas en sucursal Cojutepeque (2da planta frente a Dollar City).' },
  { id: 2, nombre: 'WhatsApp', insignia: 'Chat & Call', icono: 'fa-brands fa-whatsapp', color: 'green', descripcion: 'Ventas coordinadas mediante el canal comercial 7038-8225.' },
  { id: 3, nombre: 'Tienda Web', insignia: 'Front Office', icono: 'fa-solid fa-globe', color: 'blue', descripcion: 'Órdenes originadas desde el catálogo web digital sincronizado.' },
  { id: 4, nombre: 'Corporativo', insignia: 'Crédito Fiscal', icono: 'fa-solid fa-briefcase', color: 'purple', descripcion: 'Ventas B2B para colegios, despachos jurídicos, empresas e instituciones.' },
]

// ── Pedidos de demostración (L13, solo con SEED_DEMO=true) ──────────────────
// Del mock (admin/src/88-…/01-orders.mock.ts), con sus ids: ORD-2026-002 y 003 (Reservado, L14),
// 004 (Registrado) y 006 (Cancelado). Las horas del mock son de El Salvador (UTC−6). Los reservados se
// crean como Registrado y se reservan con `reservarEnTx` (bloqueo de fila, stock reservado e historial
// reales), `reservaDias` días desde el día del seed. Facturado y Entregado (001 y 005) llegan con L15.
// Los importes salen del mismo cálculo que la API.

const PEDIDOS_DEMO = [
  {
    id: 2, clienteId: 2, ciudad: 'San Rafael Cedros', canalId: 2, formaPago: 'Wompi / QR',
    formaEntrega: 'Retiro en Sala de Ventas (2da Planta)', notas: '',
    estado: 'registrado', creadoEn: '2026-11-02T16:15:00.000Z', reservaDias: 11,
    lineas: [
      { productoId: 6, sku: 'RDG-H510-71', nombre: 'Audífonos Gaming Diadema 7.1 Surround', cantidad: 1, precioUnitario: '45.00', descuento: '0.00' },
      { productoId: 4, sku: 'RDG-K552-RGB', nombre: 'Teclado Mecánico RGB Redragon Gamer', cantidad: 1, precioUnitario: '60.00', descuento: '0.00' },
    ],
    cargos: [],
    historial: [{ estado: 'registrado', por: 'Gabriela Solís', horas: 0, nota: null }],
  },
  {
    id: 3, clienteId: 3, ciudad: 'Cojutepeque', canalId: 3, formaPago: 'Tarjeta de Crédito',
    formaEntrega: 'Envío local Cojutepeque', notas: '',
    estado: 'registrado', creadoEn: '2026-11-02T17:05:00.000Z', reservaDias: 9,
    lineas: [{ productoId: 3, sku: 'SAM-980-1TB', nombre: 'Disco M.2 1 TB SAMSUNG NVMe 980', cantidad: 1, precioUnitario: '75.00', descuento: '0.00' }],
    cargos: [
      { concepto: 'Envío local', monto: '3.50' },
      { concepto: 'Instalación y clonado de disco', monto: '15.00' },
    ],
    historial: [{ estado: 'registrado', por: 'Tienda Web', horas: 0, nota: null }],
  },
  {
    id: 4, clienteId: 4, ciudad: 'San Salvador', canalId: 4, formaPago: 'Crédito Fiscal 30 Días',
    formaEntrega: 'Envío departamental (encomienda)', notas: 'Requiere Crédito Fiscal. Validar línea de crédito con gerencia.',
    estado: 'registrado', creadoEn: '2026-11-02T17:30:00.000Z', reservaDias: null,
    lineas: [{ productoId: 9, sku: 'HP-450G8-I5', nombre: 'Laptop HP ProBook 450 G8 Core i5', cantidad: 2, precioUnitario: '799.00', descuento: '5.00' }],
    cargos: [{ concepto: 'Envío departamental (encomienda)', monto: '8.00' }],
    historial: [{ estado: 'registrado', por: 'Ing. Marvin Castro', horas: 0, nota: null }],
  },
  {
    id: 6, clienteId: 7, ciudad: 'San Pedro Perulapán', canalId: 2, formaPago: 'Transferencia',
    formaEntrega: 'Envío local Cojutepeque', notas: '',
    estado: 'cancelado', creadoEn: '2026-11-03T21:10:00.000Z', reservaDias: null,
    lineas: [{ productoId: 11, sku: 'KNG-FB16-3200', nombre: 'Memoria RAM Kingston Fury Beast 16GB DDR4', cantidad: 2, precioUnitario: '45.00', descuento: '0.00' }],
    cargos: [],
    historial: [
      { estado: 'registrado', por: 'Gabriela Solís', horas: 0, nota: null },
      { estado: 'cancelado', por: 'Gabriela Solís', horas: 1, nota: 'La clienta desistió: RAM incompatible con su equipo.' },
    ],
  },
] as const

// ── Siembra ────────────────────────────────────────────────────────────────

export interface ResumenSeed {
  categorias: number
  marcas: number
  productos: number
  configuracion: number
  clientes: number
  ofertas: number
  canales: number
  pedidos: number
}

export interface OpcionesSeed {
  /** Siembra también los datos de demostración (ofertas de L12 y pedidos de L13). */
  demo?: boolean
}

/** Crea un producto con sus hijos y registra el stock inicial como movimiento del sistema. */
async function crearProducto(tx: Tx, p: ProductoSeed, categoriaId: number, marcaId: number) {
  const controlLotes = (p.lotes?.length ?? 0) > 0
  const stock = controlLotes ? p.lotes!.reduce((suma, lote) => suma + lote.cantidad, 0) : p.stock

  const producto = await tx.producto.create({
    data: {
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      nombre: p.nombre,
      categoriaId,
      marcaId,
      modelo: p.modelo,
      condicion: p.condicion,
      costo: p.costo,
      precio: p.precio,
      precioAnterior: p.precioAnterior,
      stock,
      puntoReorden: p.puntoReorden ?? 3,
      controlLotes,
      etiqueta: p.etiqueta,
      descripcion: p.descripcion,
      compatibilidad: p.compatibilidad,
      conectividad: p.conectividad,
      imagenes: { create: p.imagenes.slice(0, 8).map((url, orden) => ({ url, orden })) },
      especificaciones: { create: p.especificaciones.map(([clave, valor], orden) => ({ clave, valor, orden })) },
      lotes: { create: (p.lotes ?? []).map((lote) => ({ numero: lote.numero, cantidad: lote.cantidad })) },
    },
    include: { lotes: true },
  })

  const movimientos = controlLotes
    ? producto.lotes.map((lote) => ({ productoId: producto.id, loteId: lote.id, delta: lote.cantidad }))
    : stock > 0
      ? [{ productoId: producto.id, loteId: null, delta: stock }]
      : []
  if (movimientos.length > 0) {
    await tx.movimientoInventario.createMany({
      data: movimientos.map((m) => ({ ...m, motivo: MOTIVO_CARGA_INICIAL, usuarioId: null })),
    })
  }
}

/** Siembra el catálogo de A. Devuelve cuántos registros se crearon en esta ejecución. */
export async function sembrar(prisma: PrismaClient, { demo = false }: OpcionesSeed = {}): Promise<ResumenSeed> {
  // El «hoy» del negocio sale del pipeline de ofertas (misma zona horaria que la vigencia).
  const hoy = demo ? (await import('../src/10-pipeline-ofertas/00-director-ofertas.js')).hoyNegocio() : ''
  const { importeLinea, reservarEnTx, totalPedido } = await import('../src/11-pipeline-pedidos/00-director-pedidos.js')
  return prisma.$transaction(async (tx) => {
    const resumen: ResumenSeed = { categorias: 0, marcas: 0, productos: 0, configuracion: 0, clientes: 0, ofertas: 0, canales: 0, pedidos: 0 }

    const categoriaIds = new Map<string, number>()
    for (const c of CATEGORIAS) {
      const existente = await tx.categoria.findUnique({ where: { slug: c.slug } })
      const fila = existente ?? (await tx.categoria.create({ data: c }))
      if (!existente) resumen.categorias++
      categoriaIds.set(c.slug, fila.id)
    }

    const marcaIds = new Map<string, number>()
    for (const m of MARCAS) {
      const existente = await tx.marca.findUnique({ where: { slug: m.slug } })
      const fila = existente ?? (await tx.marca.create({ data: { ...m, creadaEn: CREADA_EN } }))
      if (!existente) resumen.marcas++
      marcaIds.set(m.slug, fila.id)
    }

    for (const p of PRODUCTOS) {
      const existente = await tx.producto.findFirst({ where: { OR: [{ id: p.id }, { sku: p.sku }, { slug: p.slug }] } })
      if (existente) continue
      const categoriaId = categoriaIds.get(p.categoria)
      const marcaId = marcaIds.get(p.marca)
      if (categoriaId === undefined || marcaId === undefined) {
        throw new Error(`Seed inconsistente: ${p.sku} referencia ${p.categoria}/${p.marca}.`)
      }
      await crearProducto(tx, p, categoriaId, marcaId)
      resumen.productos++
    }

    const configuracion = await tx.configuracionTienda.findUnique({ where: { id: 1 } })
    if (!configuracion) {
      await tx.configuracionTienda.create({ data: { id: 1, ...CONFIGURACION } })
      resumen.configuracion++
    }

    // Solo si no existe ese id ni ese teléfono (único por sus dígitos): nunca pisa lo editado en el admin.
    for (const { creadoEn, ...c } of CLIENTES) {
      const telefonoNormalizado = c.telefono.replace(/\D/g, '')
      const existente = await tx.cliente.findFirst({ where: { OR: [{ id: c.id }, { telefonoNormalizado }] } })
      if (existente) continue
      await tx.cliente.create({ data: { ...c, telefonoNormalizado, creadoEn: new Date(creadoEn) } })
      resumen.clientes++
    }

    // Solo si no existe ese id; enlaza los productos que sigan existiendo.
    for (const { id, productoIds, desde, hasta, ...o } of demo ? OFERTAS_DEMO : []) {
      if (await tx.oferta.findUnique({ where: { id } })) continue
      const existentes = await tx.producto.findMany({ where: { id: { in: [...productoIds] } }, select: { id: true } })
      await tx.oferta.create({
        data: {
          id,
          ...o,
          inicio: fechaRelativa(hoy, desde),
          fin: fechaRelativa(hoy, hasta),
          creadaEn: CREADA_EN,
          productos: { create: existentes.map((p) => ({ productoId: p.id })) },
        },
      })
      resumen.ofertas++
    }

    // Solo si no existe ese id ni ese nombre: nunca pisa lo editado en el admin.
    for (const c of CANALES) {
      if (await tx.canalVenta.findFirst({ where: { OR: [{ id: c.id }, { nombre: c.nombre }] } })) continue
      await tx.canalVenta.create({ data: { ...c, creadoEn: CREADA_EN } })
      resumen.canales++
    }

    // Solo si no existe ese id y siguen existiendo su cliente, su canal y sus productos.
    for (const { id, clienteId, canalId, lineas, cargos, historial, creadoEn, reservaDias, ...p } of demo ? PEDIDOS_DEMO : []) {
      if (await tx.pedido.findUnique({ where: { id } })) continue
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } })
      const canal = await tx.canalVenta.findUnique({ where: { id: canalId } })
      const productos = await tx.producto.count({ where: { id: { in: lineas.map((l) => l.productoId) } } })
      if (!cliente || !canal || productos !== lineas.length) continue
      const conImporte = lineas.map((l) => ({ ...l, importe: importeLinea(l) }))
      const inicio = new Date(creadoEn)
      await tx.pedido.create({
        data: {
          id,
          ...p,
          clienteId,
          clienteNombre: cliente.nombre,
          clienteTelefono: cliente.telefono,
          clienteCorreo: cliente.correo ?? '',
          canalId,
          canalNombre: canal.nombre,
          total: totalPedido(conImporte, [...cargos]),
          creadoEn: inicio,
          lineas: { create: conImporte },
          cargos: { create: [...cargos] },
          historial: {
            create: historial.map(({ horas, ...e }) => ({ ...e, fecha: new Date(inicio.getTime() + horas * 3_600_000) })),
          },
        },
      })
      // Reserva real (L14): si el stock no alcanzara, falla el seed en vez de inventar la reserva.
      if (reservaDias !== null) {
        const hasta = fechaRelativa(hoy, reservaDias).toISOString().slice(0, 10)
        await reservarEnTx(tx, id, hasta, { id: null, nombre: historial[0].por })
      }
      resumen.pedidos++
    }

    return resumen
  })
}

// Ejecución directa (`prisma db seed` → `tsx prisma/seed.ts`).
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const { prisma, desconectarBD } = await import('../src/03-pipeline-conexiones/00-director-conexiones.js')
  try {
    const resumen = await sembrar(prisma, { demo: process.env.SEED_DEMO === 'true' })
    console.log('Seed aplicado. Registros creados:', resumen)
  } finally {
    await desconectarBD()
  }
}
