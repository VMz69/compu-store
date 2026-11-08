import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useViewAccess, type ViewId } from '@/features/access'

interface RequireViewProps {
  view: ViewId
  children: ReactNode
}

/** Vista no permitida para el rol → primera vista habilitada del rol. */
export function RequireView({ view, children }: RequireViewProps) {
  const { allowed, homePath } = useViewAccess(view)
  return allowed ? children : <Navigate to={homePath} replace />
}
