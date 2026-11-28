-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `cotizacionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `cotizaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER UNSIGNED NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `clienteId` INTEGER NULL,
    `clienteNombre` VARCHAR(100) NOT NULL,
    `clienteTelefono` VARCHAR(20) NOT NULL,
    `clienteCorreo` VARCHAR(254) NOT NULL,
    `clienteDocumento` VARCHAR(17) NOT NULL,
    `notas` TEXT NOT NULL,
    `validezDias` TINYINT UNSIGNED NOT NULL,
    `validaHasta` DATE NOT NULL,
    `estado` ENUM('emitida', 'aceptada', 'rechazada') NOT NULL DEFAULT 'emitida',
    `emisor` JSON NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadaPorId` INTEGER NULL,
    `creadaPor` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `cotizaciones_numero_key`(`numero`),
    UNIQUE INDEX `cotizaciones_codigo_key`(`codigo`),
    INDEX `cotizaciones_creadaEn_idx`(`creadaEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizaciones_lineas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cotizacionId` INTEGER NOT NULL,
    `productoId` INTEGER NULL,
    `sku` VARCHAR(32) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `precioUnitario` DECIMAL(12, 2) NOT NULL,
    `descuento` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `importe` DECIMAL(12, 2) NOT NULL,

    INDEX `cotizaciones_lineas_cotizacionId_idx`(`cotizacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizaciones_cargos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cotizacionId` INTEGER NOT NULL,
    `concepto` VARCHAR(60) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,

    INDEX `cotizaciones_cargos_cotizacionId_idx`(`cotizacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `cotizaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_creadaPorId_fkey` FOREIGN KEY (`creadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones_lineas` ADD CONSTRAINT `cotizaciones_lineas_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `cotizaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones_lineas` ADD CONSTRAINT `cotizaciones_lineas_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones_cargos` ADD CONSTRAINT `cotizaciones_cargos_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `cotizaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Secuencia de cotizaciones (L16, D-12): una sola serie que no se reinicia con el año.
INSERT INTO `correlativos` (`clave`, `ultimo`) VALUES ('cotizacion', 0);
