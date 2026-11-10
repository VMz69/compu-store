import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/access'
import { BillingPage } from '@/features/billing'
import { CategoriesPage, ProductsPage } from '@/features/catalog'
import { CustomersPage } from '@/features/customers'
import { DashboardPage } from '@/features/dashboard'
import { InteractionsPage } from '@/features/interactions'
import { OfferBuilderPage, PromotionsPage } from '@/features/promotions'
import { NewQuotePage, QuotesPage } from '@/features/quotes'
import { EditOrderPage, NewOrderPage, OrdersPage } from '@/features/sales'
import { ChannelsPage, IdentityPage, SettingsPage, UserAccessPage, UsersPage } from '@/features/settings'
import { HomeRedirect } from './guards/HomeRedirect'
import { RequireAuth } from './guards/RequireAuth'
import { RequireView } from './guards/RequireView'
import { AdminLayout } from './layout/AdminLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { RootLayout } from './RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              { path: 'tablero', element: <RequireView view="tablero"><DashboardPage /></RequireView> },
              { path: 'productos', element: <RequireView view="productos"><ProductsPage /></RequireView> },
              {
                path: 'pedidos',
                children: [
                  { index: true, element: <RequireView view="pedidos"><OrdersPage /></RequireView> },
                  { path: 'nuevo', element: <RequireView view="pedidos"><NewOrderPage /></RequireView> },
                  { path: ':orderId/editar', element: <RequireView view="pedidos"><EditOrderPage /></RequireView> },
                ],
              },
              { path: 'facturacion', element: <RequireView view="facturacion"><BillingPage /></RequireView> },
              { path: 'clientes', element: <RequireView view="clientes"><CustomersPage /></RequireView> },
              { path: 'categorias', element: <RequireView view="categorias"><CategoriesPage /></RequireView> },
              {
                path: 'ofertas',
                children: [
                  { index: true, element: <RequireView view="ofertas"><PromotionsPage /></RequireView> },
                  { path: 'nueva', element: <RequireView view="ofertas"><OfferBuilderPage /></RequireView> },
                  { path: ':offerId/editar', element: <RequireView view="ofertas"><OfferBuilderPage /></RequireView> },
                ],
              },
              {
                path: 'cotizaciones',
                children: [
                  { index: true, element: <RequireView view="cotizaciones"><QuotesPage /></RequireView> },
                  { path: 'nueva', element: <RequireView view="cotizaciones"><NewQuotePage /></RequireView> },
                ],
              },
              { path: 'interacciones', element: <RequireView view="interacciones"><InteractionsPage /></RequireView> },
              {
                path: 'ajustes',
                children: [
                  { index: true, element: <RequireView view="ajustes"><SettingsPage /></RequireView> },
                  { path: 'canales', element: <RequireView view="ajustes"><ChannelsPage /></RequireView> },
                  { path: 'usuarios', element: <RequireView view="ajustes"><UsersPage /></RequireView> },
                  { path: 'usuarios/:userId/accesos', element: <RequireView view="ajustes"><UserAccessPage /></RequireView> },
                  { path: 'identidad', element: <RequireView view="ajustes"><IdentityPage /></RequireView> },
                ],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
], {
  // Misma base que Vite (VITE_BASE_PATH): permite desplegar en una subcarpeta.
  basename: import.meta.env.BASE_URL,
})
