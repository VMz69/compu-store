import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'

/** Punto de entrada del ecosistema BackOffice: router con shell, guards y capas globales. */
export default function App() {
  return <RouterProvider router={router} />
}
