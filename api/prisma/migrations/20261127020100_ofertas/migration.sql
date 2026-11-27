-- CreateTable
CREATE TABLE `ofertas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(80) NOT NULL,
    `etiqueta` VARCHAR(40) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `tipoDescuento` ENUM('porcentaje', 'monto') NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `inicio` DATE NOT NULL,
    `fin` DATE NOT NULL,
    `pausada` BOOLEAN NOT NULL DEFAULT false,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    INDEX `ofertas_inicio_fin_idx`(`inicio`, `fin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ofertas_productos` (
    `ofertaId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,

    INDEX `ofertas_productos_productoId_idx`(`productoId`),
    PRIMARY KEY (`ofertaId`, `productoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ofertas_productos` ADD CONSTRAINT `ofertas_productos_ofertaId_fkey` FOREIGN KEY (`ofertaId`) REFERENCES `ofertas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ofertas_productos` ADD CONSTRAINT `ofertas_productos_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
