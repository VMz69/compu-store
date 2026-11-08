import { useReviewForm } from '../../hooks/useReviewForm'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/catalog/components/reviews/ReviewForm.tsx'

const STARS = [1, 2, 3, 4, 5]

export const ReviewForm = ({ productId }: { productId: number }) => {
  const form = useReviewForm(productId)

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4"
      {...uiMeta({
        id: 'producto.reviews.form',
        component: 'ReviewForm',
        source: SOURCE,
      })}
    >
      <div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
          Escribe tu opinión
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          ¿Compraste este producto? Cuéntanos tu experiencia.
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          form.submit()
        }}
      >
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Tu calificación:
          </span>
          <div className="flex items-center gap-1.5">
            {STARS.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => form.setRating(star)}
                title={`Calificar con ${star} estrella(s)`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                  form.rating >= star
                    ? 'text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                    : 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
                {...uiMeta({
                  id: `producto.reviews.form.rating.${star}`,
                  component: 'ReviewForm',
                  source: SOURCE,
                })}
              >
                <i className="fa-solid fa-star" />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
              {form.ratingLabel}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="review-author"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            Tu Nombre:
          </label>
          <input
            id="review-author"
            type="text"
            value={form.author}
            onChange={(event) => form.setAuthor(event.target.value)}
            placeholder="Ej. Roberto Flores"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
            {...uiMeta({
              id: 'producto.reviews.form.author',
              component: 'ReviewForm',
              source: SOURCE,
            })}
          />
        </div>

        <div>
          <label
            htmlFor="review-city"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            Ciudad o Localidad:
          </label>
          <input
            id="review-city"
            type="text"
            value={form.city}
            onChange={(event) => form.setCity(event.target.value)}
            placeholder="Ej. Cojutepeque, Cuscatlán"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
            {...uiMeta({
              id: 'producto.reviews.form.city',
              component: 'ReviewForm',
              source: SOURCE,
            })}
          />
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            Tu Comentario u Opinión:
          </label>
          <textarea
            id="review-comment"
            rows={3}
            value={form.comment}
            onChange={(event) => form.setComment(event.target.value)}
            placeholder="¿Qué tal funciona el producto? ¿Cómo fue la atención de tienda?"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
            {...uiMeta({
              id: 'producto.reviews.form.comment',
              component: 'ReviewForm',
              source: SOURCE,
            })}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          {...uiMeta({
            id: 'producto.reviews.form.submit',
            component: 'ReviewForm',
            source: SOURCE,
          })}
        >
          <i className="fa-solid fa-paper-plane text-[10px]" />
          <span>Publicar mi Opinión</span>
        </button>
      </form>
    </div>
  )
}
