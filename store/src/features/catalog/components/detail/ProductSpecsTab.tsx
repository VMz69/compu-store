import { formatSku } from '@/shared/lib/formatters'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/catalog/components/detail/ProductSpecsTab.tsx'

interface ProductSpecsTabProps {
  product: Product
  availableStock: number
}

export const ProductSpecsTab = ({ product, availableStock }: ProductSpecsTabProps) => {
  const rows = [
    ['Fabricante / Marca', product.brand],
    ['Modelo Oficial', product.name],
    ['Categoría / Tipo', product.category],
    ['Código SKU de Inventario', formatSku(product.id)],
    ['Condición de Hardware', '100% Original | Pruebas de estrés superadas'],
    ['Disponibilidad en Tienda', `${availableStock} unidad(es) lista(s) para entrega`],
    ['Garantía Local', 'Garantía por escrito en sala de ventas Cojutepeque'],
    ['Compatibilidad', 'Windows 11 / Windows 10 / Linux / macOS (según aplique)'],
    ['Conectividad e Interfaces', 'Puertos estándar certificados de alta velocidad'],
  ]

  return (
    <div
      className="space-y-8 animate-fade-in"
      {...uiMeta({
        id: 'producto.tabs.specs',
        component: 'ProductSpecsTab',
        source: SOURCE,
      })}
    >
      <div className="max-w-3xl space-y-2">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
          Ficha Técnica & Especificaciones Exhaustivas
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Parámetros técnicos detallados, compatibilidad de hardware y estándares operativos
          certificados por el fabricante.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(([label, value], index) => (
              <tr
                key={label}
                className={
                  index % 2 === 0
                    ? 'bg-slate-50/80 dark:bg-slate-800/60'
                    : 'bg-white dark:bg-slate-900'
                }
              >
                <td className="py-3 px-4 sm:px-6 font-bold text-slate-500 w-1/3 sm:w-1/4">
                  {label}
                </td>
                <td className="py-3 px-4 sm:px-6 text-slate-800 dark:text-slate-200 font-medium uppercase">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-brand" />
          <span>Detalle de Componentes Integrados:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {product.specs.map((spec) => (
            <div
              key={spec}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <i className="fa-solid fa-circle-check text-emerald-500 text-xs" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {spec}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">
            Asesoría de Instalación y Compatibilidad:
          </span>
          <span>
            ¿Tienes dudas sobre si este componente es compatible con tu placa madre, procesador
            o fuente de poder? Contáctanos por WhatsApp antes de tu compra y nuestros técnicos
            en Cojutepeque te confirmarán compatibilidad sin costo.
          </span>
        </div>
      </div>
    </div>
  )
}
