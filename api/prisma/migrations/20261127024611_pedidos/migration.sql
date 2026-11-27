-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `eliminadoEn` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `canales_venta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(40) NOT NULL,
    `insignia` VARCHAR(30) NOT NULL,
    `icono` VARCHAR(60) NOT NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT 'blue',
    `descripcion` VARCHAR(160) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `canales_venta_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados_pedido` (
    `estado` ENUM('registrado', 'confirmado', 'facturado', 'entregado', 'cancelado') NOT NULL,
    `nombre` VARCHAR(30) NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,

    UNIQUE INDEX `estados_pedido_nombre_key`(`nombre`),
    PRIMARY KEY (`estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NULL,
    `clienteNombre` VARCHAR(100) NOT NULL,
    `clienteTelefono` VARCHAR(20) NOT NULL,
    `clienteCorreo` VARCHAR(254) NOT NULL,
    `ciudad` VARCHAR(80) NOT NULL,
    `canalId` INTEGER NOT NULL,
    `canalNombre` VARCHAR(40) NOT NULL,
    `formaPago` VARCHAR(60) NOT NULL,
    `formaEntrega` VARCHAR(120) NOT NULL,
    `notas` TEXT NOT NULL,
    `estado` ENUM('registrado', 'confirmado', 'facturado', 'entregado', 'cancelado') NOT NULL DEFAULT 'registrado',
    `total` DECIMAL(12, 2) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eliminadoEn` DATETIME(3) NULL,
    `eliminadoPorId` INTEGER NULL,
    `motivoEliminacion` VARCHAR(200) NULL,

    INDEX `pedidos_eliminadoEn_creadoEn_idx`(`eliminadoEn`, `creadoEn`),
    INDEX `pedidos_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_lineas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `sku` VARCHAR(32) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `precioUnitario` DECIMAL(12, 2) NOT NULL,
    `descuento` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `importe` DECIMAL(12, 2) NOT NULL,

    UNIQUE INDEX `pedidos_lineas_pedidoId_productoId_key`(`pedidoId`, `productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_cargos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `concepto` VARCHAR(60) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,

    INDEX `pedidos_cargos_pedidoId_idx`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_historial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `estado` ENUM('registrado', 'confirmado', 'facturado', 'entregado', 'cancelado') NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NULL,
    `por` VARCHAR(80) NOT NULL,
    `nota` VARCHAR(255) NULL,

    INDEX `pedidos_historial_pedidoId_idx`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_canalId_fkey` FOREIGN KEY (`canalId`) REFERENCES `canales_venta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_lineas` ADD CONSTRAINT `pedidos_lineas_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_lineas` ADD CONSTRAINT `pedidos_lineas_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_cargos` ADD CONSTRAINT `pedidos_cargos_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_historial` ADD CONSTRAINT `pedidos_historial_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_historial` ADD CONSTRAINT `pedidos_historial_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Etiquetas de estado (L13): textos de fábrica de `ORDER_STATUSES` del admin. Es lo único configurable
-- del flujo; así `migrate deploy` deja la producción lista sin depender del seed.
INSERT INTO `estados_pedido` (`estado`, `nombre`, `descripcion`) VALUES
  ('registrado', 'Registrado', 'Orden capturada (mostrador, WhatsApp, web o cotización convertida). Pendiente de validar pago o crédito.'),
  ('confirmado', 'Reservado', 'Pago o crédito validado y mercadería apartada hasta la fecha límite de la reserva, lista para facturar y entregar.'),
  ('facturado', 'Facturado', 'DTE emitido. La mercadería salió del inventario y espera ser entregada al cliente.'),
  ('entregado', 'Entregado', 'Mercadería recibida a conformidad por el cliente. Transacción cerrada.'),
  ('cancelado', 'Cancelado', 'Orden anulada por solicitud del cliente, falta de pago o inconsistencia en inventario.');
