import { RouterProvider } from 'react-router-dom'
import { router } from './01-pipeline-rutas-protegidas/00-director-rutas-protegidas'

/** Punto de entrada del ecosistema BackOffice: router con shell, guards y capas globales. */
export default function App() {
  return <RouterProvider router={router} />
}
