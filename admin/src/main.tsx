import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './00-estilos-globales.css'
import App from './00-orquestador-principal.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
