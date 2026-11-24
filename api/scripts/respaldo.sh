#!/usr/bin/env bash
# Respaldo lógico de la BD de CompuStore SV (L02).
#
# Uso (desde api/):  pnpm db:respaldar
#   ENV_FILE=.env por defecto; si DATABASE_URL ya está en el entorno, se usa esa.
# Salida: respaldos/compustore-<AAAAMMDDTHHMMSSZ>.sql.gz (carpeta ignorada por git).
# Incluye _prisma_migrations, de modo que la restauración reproduce también el estado de las migraciones.
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env}"
if [[ -z "${DATABASE_URL:-}" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "No existe $ENV_FILE ni DATABASE_URL en el entorno." >&2; exit 1; }
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'")"
fi

# Credenciales en un archivo temporal (0600): no aparecen en `ps` ni en el historial.
CNF="$(mktemp)"
trap 'rm -f "$CNF" "${TMP_SALIDA:-}"' EXIT
chmod 600 "$CNF"
BD="$(node -e '
  const u = new URL(process.argv[1]); const d = decodeURIComponent
  require("node:fs").writeFileSync(process.argv[2],
    `[client]\nuser=${d(u.username)}\npassword=${d(u.password)}\nhost=${u.hostname}\nport=${u.port || 3306}\n`)
  process.stdout.write(d(u.pathname.slice(1)))
' "$DATABASE_URL" "$CNF")"

mkdir -p respaldos
SALIDA="respaldos/${BD}-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
TMP_SALIDA="${SALIDA}.parcial"

mariadb-dump --defaults-extra-file="$CNF" \
  --single-transaction --routines --triggers --hex-blob --no-tablespaces \
  --default-character-set=utf8mb4 "$BD" | gzip -9 > "$TMP_SALIDA"
mv "$TMP_SALIDA" "$SALIDA"
TMP_SALIDA=""

echo "Respaldo creado: api/$SALIDA ($(du -h "$SALIDA" | cut -f1))"
