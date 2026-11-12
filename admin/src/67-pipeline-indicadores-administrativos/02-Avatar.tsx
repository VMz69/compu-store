import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { SafeImage } from '../81-pipeline-visualizacion-imagenes/00-director-visualizacion-imagenes'

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
