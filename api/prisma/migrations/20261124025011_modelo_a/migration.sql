-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `nombre` VARCHAR(40) NOT NULL,
    `icono` VARCHAR(60) NOT NULL,
    `descripcion` VARCHAR(160) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categorias_slug_key`(`slug`),
    UNIQUE INDEX `categorias_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marcas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `nombre` VARCHAR(40) NOT NULL,
    `sitioWeb` VARCHAR(200) NULL,
    `descripcion` VARCHAR(160) NOT NULL,
    `icono` VARCHAR(60) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `marcas_slug_key`(`slug`),
    UNIQUE INDEX `marcas_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(32) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `categoriaId` INTEGER NOT NULL,
    `marcaId` INTEGER NOT NULL,
    `modelo` VARCHAR(80) NOT NULL,
    `condicion` ENUM('nuevo', 'usado', 'reacondicionado') NOT NULL DEFAULT 'nuevo',
    `costo` DECIMAL(12, 2) NULL,
    `precio` DECIMAL(12, 2) NOT NULL,
    `precioAnterior` DECIMAL(12, 2) NULL,
    `tasaIva` DECIMAL(5, 2) NOT NULL DEFAULT 13.00,
    `stock` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `puntoReorden` INTEGER UNSIGNED NOT NULL DEFAULT 3,
    `controlLotes` BOOLEAN NOT NULL DEFAULT false,
    `publicado` BOOLEAN NOT NULL DEFAULT true,
    `etiqueta` VARCHAR(30) NULL,
    `descripcion` TEXT NOT NULL,
    `compatibilidad` TEXT NOT NULL,
    `conectividad` TEXT NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `productos_sku_key`(`sku`),
    UNIQUE INDEX `productos_slug_key`(`slug`),
    INDEX `productos_publicado_categoriaId_idx`(`publicado`, `categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagenes_producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `orden` TINYINT UNSIGNED NOT NULL,

    UNIQUE INDEX `imagenes_producto_productoId_orden_key`(`productoId`, `orden`),
    UNIQUE INDEX `imagenes_producto_productoId_url_key`(`productoId`, `url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `clave` VARCHAR(60) NOT NULL,
    `valor` VARCHAR(200) NOT NULL,
    `orden` TINYINT UNSIGNED NOT NULL,

    UNIQUE INDEX `especificaciones_productoId_orden_key`(`productoId`, `orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lotes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `numero` VARCHAR(40) NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `vence` DATE NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lotes_productoId_numero_key`(`productoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `loteId` INTEGER NULL,
    `delta` INTEGER NOT NULL,
    `motivo` VARCHAR(200) NOT NULL,
    `usuarioId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_inventario_productoId_creadoEn_idx`(`productoId`, `creadoEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firebaseUid` VARCHAR(128) NOT NULL,
    `correo` VARCHAR(254) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `rol` VARCHAR(30) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `debeCambiarContrasena` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimoAcceso` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_firebaseUid_key`(`firebaseUid`),
    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_tienda` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nombre` VARCHAR(80) NOT NULL,
    `eslogan` VARCHAR(120) NOT NULL,
    `ciudad` VARCHAR(80) NOT NULL,
    `pais` VARCHAR(60) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `direccionCorta` VARCHAR(120) NOT NULL,
    `telefonos` JSON NOT NULL,
    `whatsapp` VARCHAR(20) NOT NULL,
    `correo` VARCHAR(254) NOT NULL,
    `horario` VARCHAR(120) NOT NULL,
    `horarioCorto` VARCHAR(60) NOT NULL,
    `acercaDe` TEXT NOT NULL,
    `mision` TEXT NOT NULL,
    `vision` TEXT NOT NULL,
    `valores` JSON NOT NULL,
    `redes` JSON NOT NULL,
    `monedaCodigo` CHAR(3) NOT NULL,
    `monedaSimbolo` VARCHAR(5) NOT NULL,
    `monedaLocale` VARCHAR(10) NOT NULL,
    `actualizadaEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_marcaId_fkey` FOREIGN KEY (`marcaId`) REFERENCES `marcas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagenes_producto` ADD CONSTRAINT `imagenes_producto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especificaciones` ADD CONSTRAINT `especificaciones_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `lotes_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `lotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
