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
   - `PORT` lo inyecta Railway.
   - Health check: `/api/v1/health`.
3. Verifica con `curl https://<dominio>.up.railway.app/api/v1/health` (respuesta esperada: 200).
