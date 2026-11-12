import { normalizeProduct } from '../20-pipeline-validacion-producto/03-normalize'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

const image = (text: string) => `https://placehold.co/400x300/f8fafc/0168f5?text=${text}`

/** Datos crudos: lo no declarado lo completa `normalizeProduct`. */
type ProductSeed = Partial<Product> & Pick<Product, 'id' | 'name'>

/**
 * Catálogo de 12 productos alineado con el Front Office.
 * Los campos no declarados (IVA 13 %, punto de reorden 3, etc.) los completa
 * `normalizeProduct`.
 */
const SEEDS: ProductSeed[] = [
  {
    id: 'PRD-001', sku: 'ACR-A515-REF', name: 'Laptop Acer Aspire 5 Refurbished', slug: 'laptop-acer-aspire-5-refurbished',
    brand: 'Acer', model: 'Aspire 5 A515-56', condition: 'reacondicionado', category: 'computadoras',
    cost: 395.0, price: 525.0, originalPrice: 600.0, stock: 1, badge: 'Destacado', rating: 4.8,
    images: [image('Laptop+Acer+Aspire'), image('Acer+Teclado+Retroiluminado'), image('Acer+Puertos+Laterales'), image('Acer+Vista+Trasera')],
    description: 'Laptop reacondicionada clase A, ideal para trabajo de oficina, programación y multitarea exigente. Pantalla 15.6 pulgadas Full HD.',
    compatibility: 'Windows 11 Pro, Office 365, Linux (Ubuntu 22.04+).',
    connectivity: 'Wi-Fi 6, Bluetooth 5.1, USB-C, 2× USB-A 3.2, HDMI 1.4, RJ-45.',
    specs: [
      { key: 'Procesador', value: 'Intel Core i5 11va Gen' },
      { key: 'Memoria', value: '8 GB RAM DDR4' },
      { key: 'Almacenamiento', value: '256 GB SSD NVMe M.2' },
      { key: 'Pantalla', value: '15.6" FHD' },
    ],
  },
  {
    id: 'PRD-002', sku: 'DEL-SE2422H', name: 'Monitor Dell 24 pulg. IPS FHD 75Hz', slug: 'monitor-dell-24-ips-fhd',
    brand: 'Dell', model: 'SE2422H', condition: 'nuevo', category: 'componentes',
    cost: 185.0, price: 250.0, originalPrice: 300.0, stock: 4, badge: 'Oferta', rating: 4.9,
    images: [image('Monitor+Dell+24+IPS'), image('Dell+Bisel+Ultrafino'), image('Dell+Puertos+HDMI+VGA')],
    description: 'Pantalla IPS antirreflejo de bisel ultrafino con excelente precisión de color sRGB y conectividad HDMI/VGA.',
    compatibility: 'PC de escritorio, laptops y consolas con salida HDMI o VGA.',
    connectivity: 'HDMI 1.4, VGA.',
    specs: [
      { key: 'Resolución', value: '1920×1080 FHD' },
      { key: 'Panel', value: 'IPS 75 Hz' },
      { key: 'Tecnología', value: 'ComfortView' },
    ],
  },
  {
    id: 'PRD-003', sku: 'SAM-980-1TB', name: 'Disco M.2 1 TB SAMSUNG NVMe 980', slug: 'disco-m2-1tb-samsung-nvme',
    brand: 'Samsung', model: '980 MZ-V8V1T0', condition: 'nuevo', category: 'componentes',
    cost: 52.0, price: 75.0, originalPrice: null, stock: 7, badge: null, rating: 5.0,
    imageUrl: image('Disco+M2+Samsung+1TB'),
    description: 'Unidad de estado sólido NVMe PCIe 3.0 con velocidades de lectura secuencial de hasta 3,500 MB/s.',
    compatibility: 'Placas con ranura M.2 2280 (M-Key) PCIe 3.0/4.0.',
    connectivity: 'PCIe 3.0 ×4, NVMe 1.4.',
    specs: [
      { key: 'Capacidad', value: '1 TB' },
      { key: 'Lectura', value: '3,500 MB/s' },
      { key: 'Formato', value: 'M.2 2280' },
    ],
    lotControl: true,
    lots: [
      { id: 'LOT-003-A', lotNumber: 'L-24A', quantity: 4, expiresAt: null },
      { id: 'LOT-003-B', lotNumber: 'L-24C', quantity: 3, expiresAt: null },
    ],
  },
  {
    id: 'PRD-004', sku: 'RDG-K552-RGB', name: 'Teclado Mecánico RGB Redragon Gamer', slug: 'teclado-mecanico-rgb-redragon',
    brand: 'Redragon', model: 'Kumara K552', condition: 'nuevo', category: 'gaming',
    cost: 38.0, price: 60.0, originalPrice: 75.0, stock: 2, badge: 'Oferta', rating: 4.7,
    imageUrl: image('Teclado+RGB+Gamer'),
    description: 'Teclado mecánico con switches táctiles Outemu Blue y retroiluminación RGB dinámica configurable.',
    compatibility: 'Windows, macOS y Linux.',
    connectivity: 'USB-A cableado.',
    specs: [
      { key: 'Switches', value: 'Outemu Blue' },
      { key: 'Iluminación', value: 'RGB 16.8M colores' },
      { key: 'Distribución', value: 'Español' },
    ],
  },
  {
    id: 'PRD-005', sku: 'LOG-M185-GR', name: 'Mouse Inalámbrico Logitech M185', slug: 'mouse-inalambrico-logitech-m185',
    brand: 'Logitech', model: 'M185', condition: 'nuevo', category: 'accesorios',
    cost: 12.5, price: 20.0, originalPrice: null, stock: 10, badge: null, rating: 4.6,
    imageUrl: image('Mouse+Logitech+M185'),
    description: 'Mouse compacto y confiable con nano receptor inalámbrico de 2.4 GHz y 12 meses de autonomía.',
    compatibility: 'Windows, macOS, ChromeOS y Linux.',
    connectivity: 'Inalámbrico 2.4 GHz, nano receptor USB.',
    specs: [
      { key: 'Sensor', value: '1000 DPI' },
      { key: 'Batería', value: 'AA incluida' },
    ],
  },
  {
    id: 'PRD-006', sku: 'RDG-H510-71', name: 'Audífonos Gaming Diadema 7.1 Surround', slug: 'audifonos-gaming-diadema-7-1',
    brand: 'Redragon', model: 'Zeus H510', condition: 'nuevo', category: 'audio',
    cost: 29.0, price: 45.0, originalPrice: 55.0, stock: 2, badge: 'Últimos', rating: 4.8,
    imageUrl: image('Audifonos+Gamer+7.1'),
    description: 'Sonido envolvente 7.1 virtual con controladores de 53mm y micrófono con cancelación de ruido.',
    compatibility: 'PC, PS4/PS5 (estéreo).',
    connectivity: 'USB-A; adaptador 3.5 mm.',
    specs: [
      { key: 'Audio', value: '7.1 Virtual' },
      { key: 'Drivers', value: '53 mm' },
      { key: 'Micrófono', value: 'Con cancelación de ruido' },
    ],
  },
  {
    id: 'PRD-007', sku: 'RDG-CP-ALU', name: 'Base Enfriadora para Laptop de Aluminio', slug: 'base-enfriadora-laptop-aluminio',
    brand: 'Redragon', model: 'Coolpad Alu', condition: 'nuevo', category: 'accesorios',
    cost: 10.0, price: 18.0, originalPrice: null, stock: 15, badge: null, rating: 4.5,
    imageUrl: image('Base+Enfriadora+Aluminio'),
    description: 'Soporte ergonómico ajustable con 6 niveles de inclinación y aleación de aluminio termorresistente.',
    compatibility: 'Laptops de 10 a 16 pulgadas.',
    connectivity: 'Alimentación USB-A.',
    specs: [
      { key: 'Material', value: 'Aleación de aluminio' },
      { key: 'Niveles', value: '6 alturas' },
    ],
    reorderPoint: 5,
  },
  {
    id: 'PRD-008', sku: 'LOG-C920-FHD', name: 'Webcam Full HD 1080p con Micrófono', slug: 'webcam-full-hd-1080p',
    brand: 'Logitech', model: 'C920', condition: 'nuevo', category: 'accesorios',
    cost: 22.0, price: 35.0, originalPrice: null, stock: 0, badge: 'Agotado', rating: 4.3,
    imageUrl: image('Webcam+Full+HD+1080p'),
    description: 'Cámara web con lente de cristal Full HD y micrófono estéreo con reducción de ruido ambiental.',
    compatibility: 'Zoom, Teams, Meet; Windows y macOS.',
    connectivity: 'USB-A 2.0.',
    specs: [
      { key: 'Video', value: '1080p a 30 FPS' },
      { key: 'Audio', value: 'Micrófono estéreo' },
    ],
  },
  {
    id: 'PRD-009', sku: 'HP-450G8-I5', name: 'Laptop HP ProBook 450 G8 Core i5', slug: 'laptop-hp-probook-450-g8',
    brand: 'HP', model: 'ProBook 450 G8', condition: 'nuevo', category: 'computadoras',
    cost: 610.0, price: 799.0, originalPrice: 850.0, stock: 3, badge: 'Destacado', rating: 4.9,
    imageUrl: image('HP+ProBook+450+G8'),
    description: 'Potencia corporativa en chasis de aluminio pulido. Seguridad TPM 2.0 y excelente autonomía.',
    compatibility: 'Windows 11 Pro, dominios corporativos (TPM 2.0).',
    connectivity: 'Wi-Fi 6, Bluetooth 5.2, Thunderbolt 4, HDMI 2.0, RJ-45.',
    specs: [
      { key: 'Procesador', value: 'Intel Core i5-1135G7' },
      { key: 'Memoria', value: '16 GB RAM DDR4' },
      { key: 'Almacenamiento', value: '512 GB SSD NVMe' },
      { key: 'Pantalla', value: '15.6" FHD IPS' },
    ],
  },
  {
    id: 'PRD-010', sku: 'JBL-T500BT', name: 'Audífonos Inalámbricos JBL Pure Bass', slug: 'audifonos-inalambricos-jbl-pure-bass',
    brand: 'JBL', model: 'Tune 500BT', condition: 'nuevo', category: 'audio',
    cost: 32.0, price: 49.0, originalPrice: null, stock: 5, badge: null, rating: 4.7,
    imageUrl: image('JBL+Pure+Bass+BT'),
    description: 'Sonido legendario JBL Pure Bass con Bluetooth 5.0 y hasta 40 horas continuas de batería.',
    compatibility: 'Android, iOS, Windows y macOS.',
    connectivity: 'Bluetooth 5.0, carga USB-C.',
    specs: [
      { key: 'Batería', value: '40 horas' },
      { key: 'Carga', value: 'Rápida USB-C' },
    ],
  },
  {
    id: 'PRD-011', sku: 'KNG-FB16-3200', name: 'Memoria RAM Kingston Fury Beast 16GB DDR4', slug: 'memoria-ram-kingston-fury-16gb',
    brand: 'Kingston', model: 'KF432C16BB/16', condition: 'nuevo', category: 'componentes',
    cost: 31.0, price: 45.0, originalPrice: 52.0, stock: 8, badge: 'Oferta', rating: 5.0,
    imageUrl: image('RAM+Kingston+16GB'),
    description: 'Módulo de alto rendimiento para gaming y diseño. Disipador térmico negro de perfil bajo.',
    compatibility: 'Placas DDR4 de escritorio (DIMM); Intel XMP / AMD Ryzen.',
    connectivity: 'DIMM 288 pines.',
    specs: [
      { key: 'Capacidad', value: '16 GB' },
      { key: 'Velocidad', value: '3200 MHz CL16' },
    ],
  },
  {
    id: 'PRD-012', sku: 'RDG-GC-RECL', name: 'Silla Gamer Ergonómica Reclinable', slug: 'silla-gamer-ergonomica-reclinable',
    brand: 'Redragon', model: 'Gaia C211', condition: 'nuevo', category: 'gaming',
    cost: 128.0, price: 185.0, originalPrice: 220.0, stock: 2, badge: 'Oferta', rating: 4.8,
    imageUrl: image('Silla+Gamer+Ergonomica'),
    description: 'Comodidad suprema para largas sesiones de trabajo o juego con cojines lumbar y cervical incluidos.',
    compatibility: 'Usuarios de hasta 150 kg.',
    connectivity: 'No aplica.',
    specs: [
      { key: 'Reclinación', value: '150°' },
      { key: 'Pistón', value: 'Gas Clase 4' },
    ],
  },
]

export const PRODUCTS_MOCK: Product[] = SEEDS.map(normalizeProduct)
