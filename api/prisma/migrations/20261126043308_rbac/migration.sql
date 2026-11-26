-- L09 · RBAC por vista y acción.
-- El catálogo (roles, permisos y plantillas) es una copia exacta de los del admin:
-- admin/src/09-pipeline-accesos-por-vista/02-views.config.ts (VIEW_CATALOG) y
-- admin/src/86-pipeline-datos-demo-personas/01-roles.mock.ts (ROLES), con las acciones
-- normalizadas como en el admin (una acción solo cuenta si su vista está habilitada).
-- Se inserta aquí, antes de las claves foráneas, para que `migrate deploy` deje la BD lista.

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(60) NOT NULL,
    `orden` SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permisos` (
    `clave` VARCHAR(40) NOT NULL,
    `tipo` ENUM('vista', 'accion') NOT NULL,
    `vista` VARCHAR(20) NOT NULL,
    `orden` SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles_permisos` (
    `rolId` VARCHAR(30) NOT NULL,
    `permisoClave` VARCHAR(40) NOT NULL,

    PRIMARY KEY (`rolId`, `permisoClave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_permisos` (
    `usuarioId` INTEGER NOT NULL,
    `permisoClave` VARCHAR(40) NOT NULL,

    PRIMARY KEY (`usuarioId`, `permisoClave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Catálogo: roles (RoleId del admin)
INSERT INTO `roles` (`id`, `nombre`, `orden`) VALUES
    ('superadmin', 'Super Administrador', 1),
    ('gerencia', 'Gerencia General', 2),
    ('administracion', 'Administración', 3),
    ('caja_inventario', 'Caja e Inventarios', 4),
    ('servicio_cliente', 'Servicio al Cliente', 5);

-- Catálogo: 10 vistas + 17 acciones, en el orden del menú
INSERT INTO `permisos` (`clave`, `tipo`, `vista`, `orden`) VALUES
    ('tablero', 'vista', 'tablero', 1),
    ('productos', 'vista', 'productos', 2),
    ('productos.crear', 'accion', 'productos', 3),
    ('productos.editar', 'accion', 'productos', 4),
    ('productos.eliminar', 'accion', 'productos', 5),
    ('productos.existencias', 'accion', 'productos', 6),
    ('productos.visibilidad', 'accion', 'productos', 7),
    ('pedidos', 'vista', 'pedidos', 8),
    ('pedidos.gestionar', 'accion', 'pedidos', 9),
    ('pedidos.reservar', 'accion', 'pedidos', 10),
    ('pedidos.eliminar', 'accion', 'pedidos', 11),
    ('facturacion', 'vista', 'facturacion', 12),
    ('facturacion.emitir', 'accion', 'facturacion', 13),
    ('clientes', 'vista', 'clientes', 14),
    ('clientes.gestionar', 'accion', 'clientes', 15),
    ('clientes.eliminar', 'accion', 'clientes', 16),
    ('categorias', 'vista', 'categorias', 17),
    ('categorias.gestionar', 'accion', 'categorias', 18),
    ('ofertas', 'vista', 'ofertas', 19),
    ('ofertas.gestionar', 'accion', 'ofertas', 20),
    ('cotizaciones', 'vista', 'cotizaciones', 21),
    ('cotizaciones.gestionar', 'accion', 'cotizaciones', 22),
    ('interacciones', 'vista', 'interacciones', 23),
    ('interacciones.moderar', 'accion', 'interacciones', 24),
    ('ajustes', 'vista', 'ajustes', 25),
    ('ajustes.usuarios', 'accion', 'ajustes', 26),
    ('ajustes.configuracion', 'accion', 'ajustes', 27);

-- Plantillas. Superadmin: todo (además, el código le da acceso total).
INSERT INTO `roles_permisos` (`rolId`, `permisoClave`)
    SELECT 'superadmin', `clave` FROM `permisos`;

-- Gerencia General: sin Ajustes; sin eliminar productos.
INSERT INTO `roles_permisos` (`rolId`, `permisoClave`) VALUES
    ('gerencia', 'tablero'),
    ('gerencia', 'productos'),
    ('gerencia', 'productos.crear'),
    ('gerencia', 'productos.editar'),
    ('gerencia', 'productos.existencias'),
    ('gerencia', 'productos.visibilidad'),
    ('gerencia', 'pedidos'),
    ('gerencia', 'pedidos.gestionar'),
    ('gerencia', 'pedidos.reservar'),
    ('gerencia', 'pedidos.eliminar'),
    ('gerencia', 'facturacion'),
    ('gerencia', 'facturacion.emitir'),
    ('gerencia', 'clientes'),
    ('gerencia', 'clientes.gestionar'),
    ('gerencia', 'clientes.eliminar'),
    ('gerencia', 'categorias'),
    ('gerencia', 'categorias.gestionar'),
    ('gerencia', 'ofertas'),
    ('gerencia', 'ofertas.gestionar'),
    ('gerencia', 'cotizaciones'),
    ('gerencia', 'cotizaciones.gestionar'),
    ('gerencia', 'interacciones'),
    ('gerencia', 'interacciones.moderar');

-- Administración: sin Ajustes; sin eliminar pedidos ni clientes.
INSERT INTO `roles_permisos` (`rolId`, `permisoClave`) VALUES
    ('administracion', 'tablero'),
    ('administracion', 'productos'),
    ('administracion', 'productos.crear'),
    ('administracion', 'productos.editar'),
    ('administracion', 'productos.eliminar'),
    ('administracion', 'productos.existencias'),
    ('administracion', 'productos.visibilidad'),
    ('administracion', 'pedidos'),
    ('administracion', 'pedidos.gestionar'),
    ('administracion', 'pedidos.reservar'),
    ('administracion', 'facturacion'),
    ('administracion', 'facturacion.emitir'),
    ('administracion', 'clientes'),
    ('administracion', 'clientes.gestionar'),
    ('administracion', 'categorias'),
    ('administracion', 'categorias.gestionar'),
    ('administracion', 'ofertas'),
    ('administracion', 'ofertas.gestionar'),
    ('administracion', 'cotizaciones'),
    ('administracion', 'cotizaciones.gestionar'),
    ('administracion', 'interacciones'),
    ('administracion', 'interacciones.moderar');

-- Caja e Inventarios: pedidos, facturación, productos y clientes.
INSERT INTO `roles_permisos` (`rolId`, `permisoClave`) VALUES
    ('caja_inventario', 'productos'),
    ('caja_inventario', 'productos.existencias'),
    ('caja_inventario', 'productos.visibilidad'),
    ('caja_inventario', 'pedidos'),
    ('caja_inventario', 'pedidos.gestionar'),
    ('caja_inventario', 'pedidos.reservar'),
    ('caja_inventario', 'facturacion'),
    ('caja_inventario', 'facturacion.emitir'),
    ('caja_inventario', 'clientes'),
    ('caja_inventario', 'clientes.gestionar');

-- Servicio al Cliente: interacciones, cotizaciones, pedidos (consulta), clientes y productos (consulta).
INSERT INTO `roles_permisos` (`rolId`, `permisoClave`) VALUES
    ('servicio_cliente', 'productos'),
    ('servicio_cliente', 'pedidos'),
    ('servicio_cliente', 'clientes'),
    ('servicio_cliente', 'clientes.gestionar'),
    ('servicio_cliente', 'cotizaciones'),
    ('servicio_cliente', 'cotizaciones.gestionar'),
    ('servicio_cliente', 'interacciones'),
    ('servicio_cliente', 'interacciones.moderar');

-- Usuarios existentes no superadmin: arrancan con la plantilla de su rol.
INSERT INTO `usuarios_permisos` (`usuarioId`, `permisoClave`)
    SELECT u.`id`, rp.`permisoClave`
    FROM `usuarios` u
    JOIN `roles_permisos` rp ON rp.`rolId` = u.`rol`
    WHERE u.`rol` <> 'superadmin';

-- CreateIndex
CREATE INDEX `usuarios_rol_idx` ON `usuarios`(`rol`);

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rol_fkey` FOREIGN KEY (`rol`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_permisoClave_fkey` FOREIGN KEY (`permisoClave`) REFERENCES `permisos`(`clave`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permisos` ADD CONSTRAINT `usuarios_permisos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permisos` ADD CONSTRAINT `usuarios_permisos_permisoClave_fkey` FOREIGN KEY (`permisoClave`) REFERENCES `permisos`(`clave`) ON DELETE RESTRICT ON UPDATE CASCADE;
