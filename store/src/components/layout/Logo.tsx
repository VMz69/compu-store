import iconLogo from '@/assets/logo/icono.png'
import logoDark from '@/assets/logo/logo-bgBlack.png'
import logoLight from '@/assets/logo/logo-horizontal.png'

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
