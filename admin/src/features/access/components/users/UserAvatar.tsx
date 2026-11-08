import { cn } from '@/shared/lib/cn'
import { initialsAvatarUrl } from '@/shared/lib/initialsAvatar'

interface UserAvatarProps {
  name: string
  /** Foto personalizada (opcional). Si está vacía se genera la imagen con las iniciales. */
  avatar: string
  className?: string
  /** Aro de separación del fondo (desactivar sobre fondos oscuros como el sidebar). */
  ring?: boolean
}

/**
 * Avatar del colaborador: imagen generada con sus iniciales y un color estable
 * por nombre. Si en el futuro el usuario sube una foto, se usa esa.
 */
export function UserAvatar({ name, avatar, className = 'w-8 h-8', ring = true }: UserAvatarProps) {
  return (
    <img
      src={avatar || initialsAvatarUrl(name)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn(
        'rounded-full object-cover shrink-0 select-none',
        ring && 'ring-2 ring-white dark:ring-slate-900',
        className,
      )}
    />
  )
}
