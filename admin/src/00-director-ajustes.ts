// API pública del feature `settings`. Desde fuera solo se importa este archivo.
export { useStoreSettings } from './62-pipeline-parametros-emisor/00-director-parametros-emisor'
export { provideLastInvoiceNumber } from './62-pipeline-parametros-emisor/04-invoiceNumberPort'
export { ChannelsPage } from './60-pipeline-administracion-negocio/03-ChannelsPage'
export { IdentityPage } from './61-pipeline-identidad-comercial/00-director-identidad-comercial'
export { SettingsPage } from './59-pipeline-centro-ajustes/00-director-centro-ajustes'
export { UserAccessPage } from './60-pipeline-administracion-negocio/02-UserAccessPage'
export { UsersPage } from './60-pipeline-administracion-negocio/00-director-administracion-negocio'
// Desactivadas (sin ruta ni exportación): FiscalPage y MaintenancePage. Ver ESCALABILIDAD.md.
