import iconLogo from '@/00-recursos-estaticos/04-icono.png'
import logoDark from '@/00-recursos-estaticos/05-logo-bgBlack.png'
import logoLight from '@/00-recursos-estaticos/08-logo-horizontal.png'

interface LogoProps {
  isDark: boolean
  variant?: 'full' | 'icon'
  className?: string
}

export const Logo = ({ isDark, variant = 'full', className = 'h-10' }: LogoProps) => {
  const source = variant === 'icon' ? iconLogo : isDark ? logoDark : logoLight

  return (
    <img
      src={source}
      alt="CompuStore SV"
      className={`${className} w-auto object-contain`}
    />
  )
}
