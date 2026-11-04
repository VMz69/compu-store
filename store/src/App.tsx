import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AboutView } from '@/pages/AboutView'
import { BrandDetail } from '@/pages/BrandDetail'
import { BrandsView } from '@/pages/BrandsView'
import { CartView } from '@/pages/CartView'
import { CatalogHub } from '@/pages/CatalogHub'
import { CategoryView } from '@/pages/CategoryView'
import { ContactView } from '@/pages/ContactView'
import { FavoritesView } from '@/pages/FavoritesView'
import { Home } from '@/pages/Home'
import { OffersView } from '@/pages/OffersView'
import { ProductDetail } from '@/pages/ProductDetail'
import { SearchView } from '@/pages/SearchView'

export const App = () => (
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

export default App
