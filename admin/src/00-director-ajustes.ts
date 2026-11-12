// API pública del feature `settings`. Desde fuera solo se importa este archivo.
export { useStoreSettings } from './features/settings/hooks/useStoreSettings'
export { provideLastInvoiceNumber } from './features/settings/lib/invoiceNumberPort'
export { ChannelsPage } from './features/settings/pages/ChannelsPage'
export { IdentityPage } from './features/settings/pages/IdentityPage'
export { SettingsPage } from './features/settings/pages/SettingsPage'
export { UserAccessPage } from './features/settings/pages/UserAccessPage'
export { UsersPage } from './features/settings/pages/UsersPage'
// Desactivadas (sin ruta ni exportación): FiscalPage y MaintenancePage. Ver ESCALABILIDAD.md.
