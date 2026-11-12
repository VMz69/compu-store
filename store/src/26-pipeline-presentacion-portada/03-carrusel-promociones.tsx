import { Link } from 'react-router-dom'
import { useHeroSlider } from './02-estado-promociones'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/26-pipeline-presentacion-portada/03-carrusel-promociones.tsx'

export const HeroSlider = () => {
  const { promotion, activeSlide, total, goTo, next, prev, pause, resume } = useHeroSlider()

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`relative overflow-hidden rounded-3xl shadow-lg bg-gradient-to-r ${promotion.gradient} text-white min-h-[360px] sm:min-h-[420px] md:min-h-0 md:h-[360px] flex flex-col justify-center`}
      {...uiMeta({ id: 'home.hero', component: 'HeroSlider', source: SOURCE })}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 sm:px-12 py-6 sm:py-8 md:py-0 pb-10 sm:pb-12 md:pb-0 md:h-full">
        <div className="w-full md:w-3/5 space-y-3 sm:space-y-4 text-center md:text-left z-20 my-auto">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full ${promotion.badgeColor} text-[11px] font-black tracking-wider uppercase shadow-xs`}
          >
            <i className="fa-solid fa-bolt mr-1.5" /> {promotion.badge}
          </span>
          <h1 className="text-2xl sm:text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            {promotion.title}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">
              {promotion.discountText}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-md mx-auto md:mx-0 line-clamp-2">
            {promotion.description}
          </p>
          <div className="pt-1 sm:pt-2 flex flex-wrap gap-2.5 sm:gap-3 justify-center md:justify-start">
            <Link
              to={`/category/${promotion.targetCategory}`}
              className="bg-white text-brand-dark hover:bg-slate-100 font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-full text-xs shadow-md transition-all flex items-center gap-2"
              {...uiMeta({
                id: 'home.hero.cta-category',
                component: 'HeroSlider',
                source: SOURCE,
              })}
            >
              <span>{promotion.ctaText}</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </Link>
            <Link
              to="/offers"
              className="bg-brand-navy/60 hover:bg-brand-navy text-white font-bold py-2.5 sm:py-3 px-4 sm:px-5 rounded-full text-xs transition-all border border-white/20 flex items-center gap-2"
              {...uiMeta({
                id: 'home.hero.cta-offers',
                component: 'HeroSlider',
                source: SOURCE,
              })}
            >
              <i className="fa-solid fa-fire text-amber-400 text-xs" />
              <span>Explorar Ofertas</span>
            </Link>
          </div>
        </div>

        <div className="w-full md:w-2/5 h-28 sm:h-40 md:h-72 flex items-center justify-center md:justify-end z-10 my-auto">
          <img
            src={promotion.imageUrl}
            alt={promotion.title}
            className="max-h-full max-w-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-20 focus:outline-none cursor-pointer"
        {...uiMeta({ id: 'home.hero.prev', component: 'HeroSlider', source: SOURCE })}
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Siguiente"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-20 focus:outline-none cursor-pointer"
        {...uiMeta({ id: 'home.hero.next', component: 'HeroSlider', source: SOURCE })}
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Diapositiva ${index + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              index === activeSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            {...uiMeta({
              id: `home.hero.dot.${index}`,
              component: 'HeroSlider',
              source: SOURCE,
            })}
          />
        ))}
      </div>
    </div>
  )
}
