-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('persona', 'empresa') NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `documento` VARCHAR(17) NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `telefonoNormalizado` VARCHAR(15) NOT NULL,
    `correo` VARCHAR(254) NULL,
    `ciudad` VARCHAR(80) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `notas` TEXT NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_telefonoNormalizado_key`(`telefonoNormalizado`),
    INDEX `clientes_nombre_idx`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
