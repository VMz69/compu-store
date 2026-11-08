import { Outlet } from 'react-router-dom'
import { Footer } from './footer/Footer'
import { FloatingWhatsApp } from './FloatingWhatsApp'
import { Header } from './header/Header'
import { MobileMenuBackdrop } from './navbar/MobileMenuBackdrop'
import { Navbar } from './navbar/Navbar'
import { ToastContainer } from './ToastContainer'
import { TopBar } from './header/TopBar'
import { useLayoutInsets } from '../hooks/useLayoutInsets'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useTheme } from '@/shared/hooks/useTheme'
import { uiMeta } from '@/ui-traceability'

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
      <ToastContainer />
    </div>
  )
}
