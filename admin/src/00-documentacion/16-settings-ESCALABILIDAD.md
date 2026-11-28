# Ajustes · Sub-vistas desactivadas (oportunidad de escalabilidad)

Desde el 2026-11-10 el hub de `/ajustes` muestra solo **Canales y flujo**, **Usuarios y roles** e
**Identidad comercial**. Dos sub-vistas se retiraron del hub y de las rutas. Su código **no se
eliminó**: queda en disco, compila, pero no está conectado a nada.

## Qué está desactivado

| Sub-vista | Ruta (retirada) | Página | Piezas que la componen |
|---|---|---|---|
| Parámetros fiscales & moneda | `/ajustes/parametros` | `pages/FiscalPage.tsx` | `components/FiscalCards.tsx`, `components/TaxpayerCard.tsx` |
| Mantenimiento & respaldos | `/ajustes/mantenimiento` | `pages/MaintenancePage.tsx` | `components/BackupCard.tsx`, `components/ResetCard.tsx`, `hooks/useMaintenance.ts`, `lib/backup.ts` |

Configuración de sus tarjetas del hub: `config/hub.future.ts` (no se importa en ningún lado).

## Referencias que se limpiaron

- `app/router.tsx`: rutas `parametros` y `mantenimiento` (hoy esas URLs muestran la página 404).
- `features/settings/index.ts`: exportaciones de `FiscalPage` y `MaintenancePage`.
- `config/hub.config.ts`: tarjetas `parametros` y `mantenimiento` (movidas a `hub.future.ts`).
- `hooks/useSettingsHub.ts`: métricas de esas tarjetas.

## Qué sigue funcionando (no depende de estas vistas)

- Los datos fiscales del emisor (razón social, NIT, NRC, actividad, IVA 13%) siguen en el store de
  ajustes y se imprimen en facturas y cotizaciones; solo se dejó de **mostrar** su página informativa.
- Cada store sigue registrándose en `shared/lib/demoData.ts` (`registerDemoData`). El registro queda
  listo para cuando vuelva Mantenimiento.

## Qué se pierde mientras estén desactivadas

- **Exportar respaldo JSON** del sistema.
- **Restablecer los datos de demostración** de fábrica (para volver a los datos de prueba, borrar el
  almacenamiento del sitio en el navegador).

## Cómo reactivarlas

1. Exportar `FiscalPage` / `MaintenancePage` en `features/settings/index.ts`.
2. Agregar sus rutas hijas de `ajustes` en `app/router.tsx`.
3. Mover la tarjeta de `config/hub.future.ts` a `HUB_CARDS` (`config/hub.config.ts`), agregar su id a
   `HubCardId`, definir su `spanClass` y reajustar la cuadrícula del hub (`SettingsPage.tsx`).
4. Agregar sus métricas en `hooks/useSettingsHub.ts`.

## Oportunidades de escalabilidad (cuando exista la API)

- **Parámetros fiscales editables y versionados**: hoy son de solo lectura y viven en el navegador.
  Con backend, editarlos con auditoría (quién/cuándo) y vigencia, sin alterar documentos emitidos.
- **Respaldos del lado del servidor**: programados, con historial y **restauración** (hoy solo se
  exporta; no hay importación).
- **Mantenimiento por módulo**: restablecer o exportar un feature a la vez usando el mismo registro
  `registerDemoData`.
- **Integración DTE con Hacienda**: el sello de recepción hoy es simulado (`billing`); la vista fiscal
  es el lugar natural para credenciales, ambiente (pruebas/producción) y estado de transmisión.

## Estado tras la integración con la API (D-09, L18 · 27-11-2026)

Decisión del propietario: la funcionalidad 44 (Mantenimiento & respaldos) queda **fuera de alcance** por
ahora. El código de `63-pipeline-mantenimiento-datos/` **se conserva sin conectar**, como base por si más
adelante se crea un pipeline de mantenimiento. No se borra ni se reactiva tal como está.

- **No reactivarlo tal cual:** sus dos acciones dejaron de tener sentido con la API.
  - *Exportar JSON* copia la caché del navegador, que ya no es la fuente de verdad y puede estar incompleta
    (cada store solo carga lo que permiten las vistas del usuario).
  - *Restablecer demo* reiniciaba datos locales; repetirlo en el servidor borraría la base de datos real.
- **Respaldos hoy:** `pnpm -C api db:respaldar` / `db:restaurar` (L02, dump completo de MariaDB) y, en
  producción, respaldos de Railway + dump externo con restauración verificada (L19, D-08).
- **Si se retoma:** como lote nuevo, con un pipeline del servidor (p. ej. `16-pipeline-mantenimiento`, que
  hoy no existe): respaldos programados con historial, descarga y restauración, solo para superadmin y con
  auditoría. Esta vista sería solo su adaptador; se reactiva con los pasos de «Cómo reactivarlas», y
  `useMaintenance`/`buildBackup` se sustituyen por llamadas a la API.
