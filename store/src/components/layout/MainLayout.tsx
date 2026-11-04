import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp'
import { Header } from '@/components/layout/Header'
import { MobileMenuBackdrop } from '@/components/layout/MobileMenuBackdrop'
import { Navbar } from '@/components/layout/Navbar'
import { ToastContainer } from '@/components/layout/ToastContainer'
import { TopBar } from '@/components/layout/TopBar'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useTheme } from '@/hooks/useTheme'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/layout/MainLayout.tsx'

export const MainLayout = () => {
  useScrollToTop()
  useTheme()

  return (
    <div
      className="min-h-screen flex flex-col"
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
          className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 view-container"
          {...uiMeta({ id: 'layout.main', component: 'MainLayout', source: SOURCE })}
        >
          <Outlet />
        </main>

        <Footer />
      </div>

      <FloatingWhatsApp />
      <ToastContainer />
    </div>
  )
}
