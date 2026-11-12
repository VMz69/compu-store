import { useEffect } from 'react'
import { useUIStore } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'

/**
 * Registra la barra de compra móvil mientras está montada, para que el layout
 * reserve espacio inferior y oculte el botón flotante de WhatsApp.
 */
export const useMobileActionBar = (enabled: boolean) => {
  const setVisible = useUIStore((state) => state.setMobileActionBarVisible)

  useEffect(() => {
    setVisible(enabled)
    return () => setVisible(false)
  }, [enabled, setVisible])
}
