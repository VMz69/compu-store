import { FooterBrand } from './FooterBrand'
import { FooterLinks } from './FooterLinks'
import { FooterSocial } from './FooterSocial'
import { FooterStoreInfo } from './FooterStoreInfo'
import { STORE_CONFIG } from '@/shared/config/store.config'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/app/layout/footer/Footer.tsx'

export const Footer = () => (
  <footer
    className="bg-brand-navy text-slate-300 border-t-4 border-brand mt-auto"
    {...uiMeta({ id: 'layout.footer', component: 'Footer', source: SOURCE })}
  >
    <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 py-8 sm:py-12 lg:py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-8 lg:gap-12">
        <FooterBrand />
        <FooterStoreInfo />
        <FooterLinks />
        <FooterSocial />
      </div>

      <div
        className="mt-8 sm:mt-12 flex flex-col items-center justify-center gap-3 border-t border-slate-800 pt-6 text-center text-xs text-slate-500"
        {...uiMeta({
          id: 'layout.footer.legal',
          component: 'Footer',
          source: SOURCE,
        })}
      >
        <p
          className="max-w-2xl text-balance"
          {...uiMeta({
            id: 'layout.footer.copyright',
            component: 'Footer',
            source: SOURCE,
          })}
        >
          &copy; 2026 {STORE_CONFIG.name}. Todos los derechos reservados. Cojutepeque, El
          Salvador.
        </p>
      </div>
    </div>
  </footer>
)
