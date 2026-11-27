-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `reservadoHasta` DATE NULL;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `reservado` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- L14 (a mano): red de seguridad; los services validan antes y responden 422. Prisma no modela CHECK.
ALTER TABLE `productos` ADD CONSTRAINT `productos_reservado_stock_chk` CHECK (`reservado` <= `stock`);
