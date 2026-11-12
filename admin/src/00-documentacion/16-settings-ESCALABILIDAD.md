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
