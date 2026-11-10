// API pública del feature `settings`. Desde fuera solo se importa este archivo.
export { useStoreSettings } from './hooks/useStoreSettings'
export { provideLastInvoiceNumber } from './lib/invoiceNumberPort'
export { ChannelsPage } from './pages/ChannelsPage'
export { IdentityPage } from './pages/IdentityPage'
export { SettingsPage } from './pages/SettingsPage'
export { UserAccessPage } from './pages/UserAccessPage'
export { UsersPage } from './pages/UsersPage'
// Desactivadas (sin ruta ni exportación): FiscalPage y MaintenancePage. Ver ESCALABILIDAD.md.
