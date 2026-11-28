-- CreateTable
CREATE TABLE `resenas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NULL,
    `productoSku` VARCHAR(32) NOT NULL,
    `productoNombre` VARCHAR(120) NOT NULL,
    `autor` VARCHAR(60) NOT NULL,
    `ciudad` VARCHAR(60) NOT NULL,
    `calificacion` TINYINT UNSIGNED NOT NULL,
    `comentario` VARCHAR(1000) NOT NULL,
    `estado` ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `moderadoPorId` INTEGER NULL,
    `moderadoPor` VARCHAR(80) NULL,
    `moderadoEn` DATETIME(3) NULL,
    `motivoRechazo` VARCHAR(200) NOT NULL DEFAULT '',

    INDEX `resenas_productoId_estado_creadoEn_idx`(`productoId`, `estado`, `creadoEn`),
    INDEX `resenas_estado_creadoEn_idx`(`estado`, `creadoEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resenas` ADD CONSTRAINT `resenas_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas` ADD CONSTRAINT `resenas_moderadoPorId_fkey` FOREIGN KEY (`moderadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
