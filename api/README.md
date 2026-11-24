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
