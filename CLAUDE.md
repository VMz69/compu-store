# CompuStore SV — Instrucciones para Claude Code
Manual rector: docs/00-manual-implementacion.md
Antes de trabajar: leer §0, §9 y el lote en curso.

## Proyecto
- admin/ (BackOffice) y store/ (FrontOffice): React + Vite + TS, arquitectura FLOA.
- api/: Express + TS + Prisma + MariaDB, FLOA + VSA.

## Comandos (se completan en L01)
- api: pnpm dev · pnpm test · pnpm check
- admin / store: pnpm dev · pnpm build

## Reglas no negociables
- Un lote por sesión; modo plan y aprobación antes de editar.
- Cambios quirúrgicos; no modificar código funcional fuera del lote.
- No rediseñar, mover ni eliminar componentes de admin/ ni store/; solo adaptadores de datos.
- Pipelines y archivos numerados de forma consecutiva, sin saltos; nunca renumerar.
- Entre dominios solo vía 00-director-*; sin imports cruzados ni ciclos.
- No crear archivos, capas ni carpetas vacías por anticipación.
- Dinero DECIMAL, fechas UTC; importes recalculados en el servidor.
- Nunca credenciales en el código ni .env en git.
- Tras cada paso: pnpm check. Si se rompe y no se corrige en el paso: revertir.
- Al cerrar el lote: actualizar §9 y §10 del manual y hacer commit `feat(Lxx): …`.