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

## Despliegue en Railway (pospuesto a L08, decisión D-02)
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
