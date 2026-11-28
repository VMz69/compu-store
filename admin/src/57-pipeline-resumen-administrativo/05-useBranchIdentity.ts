import { useStoreSettings } from '@/00-director-ajustes'

/**
 * Datos de la sucursal para el banner del Tablero (L18), tomados de la identidad comercial
 * (Ajustes › Identidad, API de L10) en vez de textos fijos:
 * - título: nombre · «Sucursal» + la ciudad sin el departamento («Cojutepeque, Cuscatlán» → «Cojutepeque»);
 * - línea de contacto: dirección y teléfonos (el banner añade «· Horario: …»).
 */
export function useBranchIdentity() {
  const settings = useStoreSettings()
  const branch = settings.city.split(',')[0]?.trim() ?? ''
  const address = settings.address.trim().replace(/\.+$/, '')
  const phones = settings.phones.map((phone) => phone.trim()).filter(Boolean)

  return {
    title: branch ? `${settings.name} · Sucursal ${branch}` : settings.name,
    address: [address, phones.length > 0 ? `Tel. ${phones.join(' / ')}` : ''].filter(Boolean).join(' · '),
    schedule: settings.schedule,
  }
}
