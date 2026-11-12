import { Badge } from '@/00-director-interfaz'
import type { Role } from '../06-pipeline-sesion-permisos/05-types'

interface RoleBadgeProps {
  role: Role
  withIcon?: boolean
}

export function RoleBadge({ role, withIcon = false }: RoleBadgeProps) {
  return (
    <Badge shape="full" icon={withIcon ? `fa-solid ${role.icon}` : undefined} className={role.badgeClass}>
      {role.name}
    </Badge>
  )
}
