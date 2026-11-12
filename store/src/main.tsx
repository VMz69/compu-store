import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './00-estilos-globales.css'
import App from './00-director-aplicacion.tsx'
import { normalizeInitialView } from '@/02-vista-inicial'

normalizeInitialView()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
