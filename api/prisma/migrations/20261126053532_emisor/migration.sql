/*
  Warnings:

  - Added the required column `actividadEconomica` to the `configuracion_tienda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nit` to the `configuracion_tienda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nrc` to the `configuracion_tienda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razonSocial` to the `configuracion_tienda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoEstablecimiento` to the `configuracion_tienda` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `configuracion_tienda` ADD COLUMN `actividadEconomica` VARCHAR(120) NOT NULL,
    ADD COLUMN `nit` VARCHAR(17) NOT NULL,
    ADD COLUMN `nrc` VARCHAR(9) NOT NULL,
    ADD COLUMN `razonSocial` VARCHAR(100) NOT NULL,
    ADD COLUMN `semillaFactura` INTEGER UNSIGNED NULL,
    ADD COLUMN `tipoEstablecimiento` VARCHAR(30) NOT NULL;
