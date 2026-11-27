-- CreateTable
CREATE TABLE `correlativos` (
    `clave` VARCHAR(30) NOT NULL,
    `ultimo` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroControl` VARCHAR(31) NOT NULL,
    `correlativo` INTEGER UNSIGNED NOT NULL,
    `codigoGeneracion` CHAR(36) NOT NULL,
    `selloRecepcion` CHAR(40) NOT NULL,
    `pedidoId` INTEGER NOT NULL,
    `pedidoActivoId` INTEGER NULL,
    `consumidorFinal` BOOLEAN NOT NULL,
    `receptorNombre` VARCHAR(100) NOT NULL,
    `receptorDocumento` VARCHAR(17) NOT NULL,
    `receptorDireccion` VARCHAR(255) NOT NULL,
    `receptorCorreo` VARCHAR(254) NOT NULL,
    `receptorTelefono` VARCHAR(20) NOT NULL,
    `condicionPago` ENUM('efectivo', 'tarjeta', 'transferencia', 'credito') NOT NULL,
    `notas` TEXT NOT NULL,
    `emisor` JSON NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('emitida', 'anulada') NOT NULL DEFAULT 'emitida',
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadaPorId` INTEGER NULL,
    `creadaPor` VARCHAR(80) NOT NULL,
    `anuladaEn` DATETIME(3) NULL,
    `anuladaPorId` INTEGER NULL,
    `anuladaPor` VARCHAR(80) NULL,

    UNIQUE INDEX `facturas_numeroControl_key`(`numeroControl`),
    UNIQUE INDEX `facturas_correlativo_key`(`correlativo`),
    UNIQUE INDEX `facturas_codigoGeneracion_key`(`codigoGeneracion`),
    UNIQUE INDEX `facturas_pedidoActivoId_key`(`pedidoActivoId`),
    INDEX `facturas_estado_creadaEn_idx`(`estado`, `creadaEn`),
    INDEX `facturas_pedidoId_idx`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas_lineas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facturaId` INTEGER NOT NULL,
    `tipo` ENUM('producto', 'cargo') NOT NULL,
    `productoId` INTEGER NULL,
    `sku` VARCHAR(32) NULL,
    `descripcion` VARCHAR(120) NOT NULL,
    `unidad` VARCHAR(20) NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `precioUnitario` DECIMAL(12, 2) NOT NULL,
    `descuento` DECIMAL(12, 2) NOT NULL,
    `importe` DECIMAL(12, 2) NOT NULL,
    `lotes` JSON NULL,

    INDEX `facturas_lineas_facturaId_idx`(`facturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_creadaPorId_fkey` FOREIGN KEY (`creadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_anuladaPorId_fkey` FOREIGN KEY (`anuladaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas_lineas` ADD CONSTRAINT `facturas_lineas_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas_lineas` ADD CONSTRAINT `facturas_lineas_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- L15 (a mano): últimos números usados antes de este sistema (constantes del admin: LAST_CONTROL y
-- LAST_INTERNAL). Así `migrate deploy` deja producción lista para emitir (D-12).
INSERT INTO `correlativos` (`clave`, `ultimo`) VALUES ('factura-control', 2074), ('factura-interno', 15781);

