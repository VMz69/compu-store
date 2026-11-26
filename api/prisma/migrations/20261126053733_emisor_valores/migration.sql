-- L10 · Completa el emisor de la configuración existente (id = 1).
-- La migración `emisor` agregó las columnas sin default; en una tabla con datos, MariaDB
-- (sin modo estricto) las dejó en ''. Aquí se rellenan con los valores de fábrica del admin
-- (admin/src/85-pipeline-identificadores-texto/03-store.config.ts), sin tocar lo ya editado.
UPDATE `configuracion_tienda`
SET
    `razonSocial` = 'COMPU STORE SAS DE CV',
    `nit` = '07181607251010',
    `nrc` = '367628-0',
    `actividadEconomica` = 'Venta al por menor de computadoras y equipo periférico',
    `tipoEstablecimiento` = 'Casa matriz'
WHERE `id` = 1 AND `razonSocial` = '';
