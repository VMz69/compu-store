#!/usr/bin/env bash
# Restaura un respaldo de scripts/respaldo.sh sobre la BD indicada (L02).
#
# Uso (desde api/):  pnpm db:restaurar respaldos/compustore-<fecha>.sql.gz
#   ENV_FILE=.env por defecto (o DATABASE_URL en el entorno) elige la BD de destino.
#   CONFIRMAR=si omite la pregunta de confirmación (uso en scripts).
# Borra TODAS las tablas de la BD de destino antes de cargar el respaldo, para que el resultado
# sea idéntico al momento del respaldo (datos y _prisma_migrations).
set -euo pipefail
cd "$(dirname "$0")/.."

ARCHIVO="${1:-}"
[[ -n "$ARCHIVO" && -f "$ARCHIVO" ]] || { echo "Uso: pnpm db:restaurar <respaldos/archivo.sql.gz>" >&2; exit 1; }

ENV_FILE="${ENV_FILE:-.env}"
if [[ -z "${DATABASE_URL:-}" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "No existe $ENV_FILE ni DATABASE_URL en el entorno." >&2; exit 1; }
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'")"
fi

# Credenciales en un archivo temporal (0600): no aparecen en `ps` ni en el historial.
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
chmod 600 "$CNF"
read -r BD HOST < <(node -e '
  const u = new URL(process.argv[1]); const d = decodeURIComponent
  require("node:fs").writeFileSync(process.argv[2],
    `[client]\nuser=${d(u.username)}\npassword=${d(u.password)}\nhost=${u.hostname}\nport=${u.port || 3306}\n`)
  process.stdout.write(`${d(u.pathname.slice(1))} ${u.hostname}:${u.port || 3306}\n`)
' "$DATABASE_URL" "$CNF")

gzip -t "$ARCHIVO" || { echo "El archivo $ARCHIVO está dañado o no es gzip." >&2; exit 1; }

if [[ "${CONFIRMAR:-}" != "si" ]]; then
  echo "Se borrarán todas las tablas de '$BD' en $HOST y se cargará $ARCHIVO."
  read -r -p "Escribe el nombre de la BD para continuar: " RESPUESTA
  [[ "$RESPUESTA" == "$BD" ]] || { echo "Cancelado." >&2; exit 1; }
fi

MYSQL=(mariadb --defaults-extra-file="$CNF" --default-character-set=utf8mb4 "$BD")

# 1) Vaciar el esquema de destino (también las tablas que el respaldo no contenga).
TABLAS="$("${MYSQL[@]}" -N -e "SELECT GROUP_CONCAT(CONCAT('\`', table_name, '\`')) FROM information_schema.tables WHERE table_schema = DATABASE()")"
if [[ -n "$TABLAS" && "$TABLAS" != "NULL" ]]; then
  "${MYSQL[@]}" -e "SET FOREIGN_KEY_CHECKS = 0; DROP TABLE $TABLAS; SET FOREIGN_KEY_CHECKS = 1;"
fi

# 2) Cargar el respaldo.
gzip -dc "$ARCHIVO" | "${MYSQL[@]}"

echo "Restauración completada en '$BD' desde $ARCHIVO."
