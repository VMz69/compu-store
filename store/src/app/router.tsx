import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layout/MainLayout'
import { AboutView, ContactView } from '@/features/info'
import { BrandDetail, BrandsView, CatalogHub, CategoryView, FavoritesView, OffersView, ProductDetail } from '@/features/catalog'
import { CartView } from '@/features/cart'
import { Home } from '@/features/home'
import { SearchView } from '@/features/search'

/** Árbol de rutas del Front Office (HashRouter en `main.tsx`). */
export const AppRoutes = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="/categories" element={<CatalogHub />} />
      <Route path="/category/:slug" element={<CategoryView />} />
      <Route path="/brands" element={<BrandsView />} />
      <Route path="/brand/:slug" element={<BrandDetail />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/offers" element={<OffersView />} />
      <Route path="/cart" element={<CartView />} />
      <Route path="/favorites" element={<FavoritesView />} />
      <Route path="/search" element={<SearchView />} />
      <Route path="/about" element={<AboutView />} />
      <Route path="/contact" element={<ContactView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)
