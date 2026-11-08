import { cn } from '@/shared/lib/cn'
import { SafeImage } from './SafeImage'

interface AvatarProps {
  src: string
  name: string
  className?: string
}

export function Avatar({ src, name, className = 'w-8 h-8 rounded-lg' }: AvatarProps) {
  return (
    <SafeImage
      src={src}
      alt={name}
      className={cn('object-cover shrink-0 border border-slate-200 dark:border-slate-700', className)}
    />
  )
}
