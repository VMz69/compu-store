import { Badge } from '@/shared/ui'
import type { Role } from '../types'

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
