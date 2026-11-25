-- AlterTable
ALTER TABLE `imagenes_producto` ADD COLUMN `publicId` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `imagenes_pendientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `imagenes_pendientes_publicId_key`(`publicId`),
    INDEX `imagenes_pendientes_creadaEn_idx`(`creadaEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
