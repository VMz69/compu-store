# API de CompuStore SV

Express 5 + TypeScript + Prisma 7 (adaptador MariaDB) + MariaDB 11.8. Arquitectura FLOA + VSA (ver `docs/00-manual-implementacion.md`).

## Requisitos
- Node 26 LTS y pnpm 12.
- MariaDB 11.8 en local con dos bases: `compustore` (desarrollo) y `compustore_test` (pruebas, D-15).

## Base de datos local (una sola vez)
```sql
CREATE DATABASE compustore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE compustore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE compustore_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'compustore'@'localhost' IDENTIFIED BY '<tu-contraseña>';
GRANT ALL PRIVILEGES ON compustore.* TO 'compustore'@'localhost';
GRANT ALL PRIVILEGES ON compustore_test.* TO 'compustore'@'localhost';
GRANT ALL PRIVILEGES ON compustore_shadow.* TO 'compustore'@'localhost';
```
Después, copia `.env.example` a `.env` (bases `compustore` y `compustore_shadow`) y a `.env.test` (base `compustore_test`). Ninguno de los dos se sube a git.

## Comandos
| Comando | Qué hace |
|---|---|
| `pnpm dev` | API en modo watch con `.env` (puerto 3000) |
| `pnpm build` | genera el cliente Prisma y compila a `dist/` |
| `pnpm start` | ejecuta `dist/src/00-main.js` |
| `pnpm test` | Vitest + Supertest contra `compustore_test` |
| `pnpm check` | typecheck + lint + test + ciclos (madge) |
| `pnpm usuarios:vincular` | vincula una cuenta de Firebase con su Usuario (ver "Firebase y acceso") |

Comprobación rápida: `curl http://localhost:3000/api/v1/health` devuelve 200 con la BD activa y 503 si la BD no responde.

## Datos y respaldo (L02)
| Comando | Qué hace |
|---|---|
| `pnpm db:migrar` | `prisma migrate dev`: crea y aplica migraciones en desarrollo (usa la shadow DB) |
| `pnpm db:desplegar` | `prisma migrate deploy`: aplica las migraciones pendientes (producción/CI) |
| `pnpm db:sembrar` | seed idempotente del catálogo de A (`prisma/seed.ts`); solo crea lo que falta, nunca sobrescribe |
| `SEED_DEMO=true pnpm db:sembrar` | además siembra las 3 ofertas de demostración (L12) con fechas relativas al día del seed (una vigente, una programada y una vencida); idempotente por id. Sin la variable no hay ofertas de muestra. Desde L13 también siembra los pedidos 4 (Registrado) y 6 (Cancelado) del mock; los 4 canales de venta se siembran siempre |
| `pnpm db:reiniciar` | **borra la BD de desarrollo**, reaplica las migraciones y siembra (Prisma 7 no siembra solo al resetear) |
| `pnpm db:respaldar` | volcado `mariadb-dump` comprimido en `respaldos/<bd>-<fechaUTC>.sql.gz` (ignorado por git) |
| `pnpm db:restaurar <archivo>` | borra **todas** las tablas de la BD de destino y carga el respaldo; pide escribir el nombre de la BD |

- Ambos scripts toman la BD de `DATABASE_URL` (entorno) o de `ENV_FILE` (por defecto `.env`); las credenciales viajan en un archivo temporal 0600, nunca en la línea de comandos. `CONFIRMAR=si` omite la pregunta (solo para automatizar).
- El respaldo incluye `_prisma_migrations`: tras restaurar, `prisma migrate status` coincide con el momento del respaldo.
- Las pruebas aplican las migraciones a `compustore_test` antes de ejecutarse y **abortan si la BD de `.env.test` no termina en `_test`**, porque vacían tablas.
- Requiere `mariadb-dump`, `mariadb` y `gzip` (cliente de MariaDB 11.8).

## Firebase y acceso (L03)
Firebase Auth identifica, MariaDB (`usuarios.firebase_uid`) habilita y la API lo impone: todo `/api/v1/admin/*` responde 401 sin un ID token válido y 403 si la cuenta no está vinculada a un Usuario activo. No hay contraseñas en la BD ni en el código.

### Variables de `api/.env`
Se extraen del JSON de la cuenta de servicio (Consola de Firebase › Configuración del proyecto › Cuentas de servicio › *Generar nueva clave privada*). El JSON se queda fuera del repositorio.

| Variable | Origen | Cómo obtenerla |
|---|---|---|
| `FIREBASE_PROJECT_ID` | campo `project_id` | `jq -r .project_id cuenta.json` |
| `FIREBASE_CLIENT_EMAIL` | campo `client_email` | `jq -r .client_email cuenta.json` |
| `FIREBASE_PRIVATE_KEY` | campo `private_key` | `jq .private_key cuenta.json` (sin `-r`) |
| `FIREBASE_WEB_API_KEY` | config. web de la app `compustore-admin` (`apiKey`) | Configuración del proyecto › General › Tus apps |

La private key se pega **en una sola línea, entre comillas dobles y con los `\n` literales**, tal como la imprime `jq .private_key`:
```dotenv
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```
La API también acepta saltos de línea reales; en Railway se pega igual, con los `\n`. `pnpm dev`/`pnpm start` se niegan a arrancar si falta alguna de las tres primeras (se nombra la variable, nunca el valor). Seed, respaldo y pruebas no las necesitan: las pruebas inyectan un proveedor falso.

### Alta de las 2 cuentas (procedimiento del propietario)
1. En la consola de Firebase › Authentication, crea cada cuenta con correo y contraseña (o ya existen). La contraseña la define su dueño; nunca pasa por la API ni por el repositorio.
2. Vincula cada cuenta con su Usuario (idempotente; repetirlo actualiza nombre, teléfono y rol):
   ```bash
   pnpm usuarios:vincular --correo <correo> --nombre "<Nombre Apellido>" [--telefono 7000-0000]
   ```
   - El rol por defecto es `superadmin` (las 2 cuentas de la Fase A); `--rol` acepta los `RoleId` del admin.
   - `--debe-cambiar` obliga a definir una contraseña nueva en el siguiente ingreso.
   - `--enviar-restablecimiento` hace que Firebase envíe a esa cuenta su correo para restablecer la contraseña (requiere `FIREBASE_WEB_API_KEY`).
3. Para desactivar el acceso sin borrar historial: `UPDATE usuarios SET activo = 0 WHERE correo = '…';` (la siguiente petición responde 403).

### Endpoints
| Método y ruta | Uso |
|---|---|
| `GET /api/v1/admin/sesion` | restaurar sesión: usuario vinculado al token |
| `POST /api/v1/admin/sesion` | inicio de sesión: registra `ultimoAcceso` (UTC) |
| `PUT /api/v1/admin/sesion/contrasena` | `{ "contrasena": "…" }`: cambio de la contraseña propia (≥8, minúscula, mayúscula y número); revoca los tokens anteriores → 204 |

## Usuarios y RBAC (L09)
- Permisos por **vista** (`productos`, `ajustes`…) y **acción** (`productos.crear`, `ajustes.usuarios`…), copiados del admin. El catálogo, los 5 roles (plantillas) y sus permisos los inserta la migración `rbac`; los accesos propios de cada usuario están en `usuarios_permisos` (el superadmin tiene acceso total sin filas).
- `requierePermiso(...)` protege **todas** las rutas `/admin` salvo las de `/sesion`, y lee los permisos de la BD en cada petición. Sin permiso → 403 `PERMISSION_DENIED`. La matriz completa está en `tests/11-permisos.test.ts`, que además falla si una ruta nueva no lleva `requierePermiso`.
- Mientras `debeCambiarContrasena` esté activo, todo `/admin` salvo `/sesion` responde 403 `PASSWORD_CHANGE_REQUIRED`.
- `pnpm usuarios:vincular --rol <rol>` asigna la plantilla del rol si el usuario es nuevo o cambia de rol.

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/v1/admin/usuarios` | vista `ajustes` | lista con `accesos` (forma de la sesión) |
| `POST /api/v1/admin/usuarios` | `ajustes.usuarios` | `{nombre, correo, telefono?, rol, activo, contrasena, debeCambiarContrasena}`: cuenta de Firebase + Usuario con la plantilla del rol → 201 (409 si el correo ya existe; si la BD falla, se borra la cuenta creada) |
| `PATCH /api/v1/admin/usuarios/:id` | `ajustes.usuarios` | perfil parcial; cambiar el rol reinicia los accesos; `activo`/`correo` se sincronizan con Firebase (desactivar = deshabilitar + revocar sesiones) |
| `PUT /api/v1/admin/usuarios/:id/accesos` | `ajustes.usuarios` | `{vistas, acciones}` normalizados (≥ 1 vista) |
| `PUT /api/v1/admin/usuarios/:id/contrasena` | `ajustes.usuarios` | `{contrasena, debeCambiarContrasena}`: contraseña temporal con el Admin SDK → 204 |
| `DELETE /api/v1/admin/usuarios/:id` | `ajustes.usuarios` | borra en la BD y después en Firebase → 204; 409 si tiene historial de inventario («desactívalo en su lugar») |

Reglas: nadie se elimina, se desactiva, cambia su rol ni edita sus accesos (422); siempre queda un superadmin activo (422, con bloqueo de filas); solo un superadmin asigna ese rol o toca cuentas superadmin, y quien no lo es solo otorga lo que tiene (403).

## Productos e imágenes (L05)
Las imágenes de productos se guardan en Cloudinary (D-17). El admin sube cada archivo como binario al guardar el producto; la API lo valida y lo sube.

### Variables de `api/.env`
Panel de Cloudinary › *Settings* › *API Keys* (el API secret nunca va al repositorio):

| Variable | Valor |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | *Cloud name* |
| `CLOUDINARY_API_KEY` | *API Key* |
| `CLOUDINARY_API_SECRET` | *API Secret* |

`pnpm dev`/`pnpm start` se niegan a arrancar si falta alguna; seed, respaldo y pruebas no las necesitan (las pruebas inyectan un almacén falso). Las imágenes van a la carpeta `compustore/productos`.

### Imágenes huérfanas
- Toda subida queda en `imagenes_pendientes` hasta que un producto la adopta al guardarse.
- Si el guardado falla, el admin descarta en el acto lo que subió (`DELETE /admin/imagenes/:id`).
- Cada subida barre las pendientes con más de 1 h (por si el navegador se cerró a medias).
- Lo que se quita de un producto, o las imágenes de un producto eliminado, se destruye en Cloudinary tras el commit; si Cloudinary falla, se reencola para el siguiente barrido.
- Las URLs externas (seed o pegadas a mano) tienen `publicId` nulo y nunca se destruyen.

### Endpoints
| Método y ruta | Uso |
|---|---|
| `GET /api/v1/admin/productos[/:id]` | listado paginado (D-06) y detalle, forma admin (contratos-A §4.2) |
| `POST /api/v1/admin/productos` | alta: SKU opcional (si falta, `PRD-###`), slug único generado, stock inicial registrado como movimiento |
| `PATCH /api/v1/admin/productos/:id` | edición parcial; `imagenes` y `especificaciones` reemplazan la lista; stock y lotes en L06 |
| `PATCH /api/v1/admin/productos/:id/publicado` | `{ "publicado": bool }` |
| `DELETE /api/v1/admin/productos/:id` | 204 sin historial de inventario; 409 si tiene movimientos (ocultarlo en su lugar) |
| `POST /api/v1/admin/imagenes` | cuerpo binario `image/png\|jpeg\|webp`, máx. 1.5 MB → 201 `{ id, url }` |
| `DELETE /api/v1/admin/imagenes/:id` | descarta una imagen pendiente (no adoptada) |
| `GET /api/v1/tienda/productos[/:id]` | solo publicados, forma pública (§4.1); filtros y orden en L07 |

## Tienda pública (L07A)
Rutas públicas de solo lectura bajo `/api/v1/tienda`, salvo la validación del carrito (con límite de tasa).

| Método y ruta | Uso |
|---|---|
| `GET /tienda/productos?q&categoria&marca&ofertas&orden&page&limit` | solo publicados. `q` (≤100) busca sin mayúsculas ni acentos en nombre, descripción, categoría, marca y especificaciones; `categoria`/`marca` por slug; `ofertas=true` → `precioAnterior > precio`; `orden` ∈ `destacados` (por defecto) \| `precio-asc` \| `precio-desc` \| `descuento` \| `nombre-asc`, con desempate por id |
| `GET /tienda/productos/:id/relacionados?limit` | misma categoría o marca, publicados, por id; `limit` 1–12 (4 por defecto); 404 si el producto no está publicado |
| `GET /tienda/categorias` · `GET /tienda/marcas` | con `totalProductos` (L04) |
| `GET /tienda/identidad` | nombre, contacto, horarios, WhatsApp, textos, redes y moneda |
| `POST /tienda/carrito/validar` | `{ lineas: [{ productoId, cantidad }] }` (1–50 líneas, cantidad 1–99, sin repetidos) → precios y existencias recalculados por línea (`ok \| ajustada \| agotado \| no-disponible`), `total` y `valido`. No reserva ni crea pedidos. 30 peticiones/min por IP → 429 `TOO_MANY_REQUESTS` |

## Pedidos y canales (L13A)
Bajo `/api/v1/admin`. El servidor fija precios (precio efectivo de L12) y calcula importes y totales; el navegador solo envía cantidades, descuentos (0–100 %) y cargos.

| Método y ruta | Uso |
|---|---|
| `GET /pedidos?estado&page&limit` · `GET /pedidos/:id` | vigentes (sin eliminados), los más recientes primero |
| `POST /pedidos` · `PATCH /pedidos/:id` | registrar / reemplazar los datos editables (solo Registrado o Reservado); las líneas existentes conservan su precio |
| `PATCH /pedidos/:id/estado` | `{ estado: "cancelado" \| "entregado", nota? }`; 422 si la transición no es válida |
| `DELETE /pedidos/:id` | `{ motivo }` (5–200); eliminación lógica, 422 si está facturado o entregado |
| `GET/POST /canales-venta` · `PATCH/DELETE /canales-venta/:id` | 409 al eliminar un canal con pedidos |
| `GET /estados-pedido` · `PUT /estados-pedido/:estado` | nombre visible y descripción de cada estado |

## Despliegue en Railway (L19 «Despliegue final»; L08 solo como contingencia — decisión D-02)
1. **Base de datos:** nuevo servicio desde la imagen Docker `mariadb:11.8`.
   - Volumen montado en `/var/lib/mysql`.
   - Variables: `MARIADB_ROOT_PASSWORD`, `MARIADB_DATABASE=compustore`, `MARIADB_USER=compustore` y `MARIADB_PASSWORD`, todas generadas en Railway.
2. **API:** nuevo servicio desde este repositorio, con *Root Directory* `/api`.
   - Build: `pnpm install && pnpm build`. Start: `pnpm start`.
   - Variables:
     - `NODE_ENV=production`
     - `DATABASE_URL=mysql://compustore:<MARIADB_PASSWORD>@<host-privado-mariadb>:3306/compustore`, usando las referencias de variables de Railway y la red privada.
     - `CORS_ORIGINS` (las URLs de Vercel cuando existan).
     - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` (ver "Firebase y acceso").
   - `PORT` lo inyecta Railway.
   - Health check: `/api/v1/health`.
3. Verifica con `curl https://<dominio>.up.railway.app/api/v1/health` (respuesta esperada: 200).
