import { Outlet } from 'react-router-dom'
import { Footer } from '@/36-pipeline-pie-tienda/00-director-pie-tienda'
import { FloatingWhatsApp } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'
import { Header } from '@/33-pipeline-cabecera-tienda/00-director-cabecera-tienda'
import { MobileMenuBackdrop } from './03-fondo-menu-movil'
import { Navbar } from '@/35-pipeline-navegacion-tienda/00-director-navegacion-tienda'
import { ToastContainer } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import { TopBar } from '@/33-pipeline-cabecera-tienda/00-director-cabecera-tienda'
import { useLayoutInsets } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'
import { useScrollToTop } from './01-restaurar-desplazamiento'
import { useTheme } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/MainLayout.tsx'

export const MainLayout = () => {
  useScrollToTop()
  useTheme()
  const { hasMobileActionBar } = useLayoutInsets()

  return (
    <div
      className={`min-h-screen flex flex-col ${hasMobileActionBar ? 'pb-20 lg:pb-0' : ''}`}
      {...uiMeta({ id: 'layout.shell', component: 'MainLayout', source: SOURCE })}
    >
      <TopBar />

      <header
        className="sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors"
        {...uiMeta({ id: 'layout.sticky-header', component: 'MainLayout', source: SOURCE })}
      >
        <Header />
        <Navbar />
      </header>

      <MobileMenuBackdrop />

      <div className="flex flex-1 flex-col overflow-x-clip">
        <main
          className="flex-grow max-w-app w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-6 md:py-8 view-container"
          {...uiMeta({ id: 'layout.main', component: 'MainLayout', source: SOURCE })}
        >
          <Outlet />
        </main>

        <Footer />
      </div>

      <FloatingWhatsApp hiddenOnMobile={hasMobileActionBar} />
      <ToastContainer aboveActionBar={hasMobileActionBar} />
    </div>
  )
}
