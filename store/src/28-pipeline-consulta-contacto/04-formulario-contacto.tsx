import { useContactForm } from './03-estado-contacto'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/info/components/ContactForm.tsx'

const inputClass =
  'w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand focus:outline-none'

export const ContactForm = () => {
  const { form, setField, submit, subjects } = useContactForm()

  return (
    <div
      className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-4"
      {...uiMeta({ id: 'contacto.form', component: 'ContactForm', source: SOURCE })}
    >
      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
        Enviar Consulta o Cotización
      </h3>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 text-xs">
            <label
              htmlFor="contact-name"
              className="font-bold text-slate-700 dark:text-slate-300 block"
            >
              Tu Nombre:
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              className={inputClass}
              placeholder="Ej. Carlos Mendoza"
              {...uiMeta({
                id: 'contacto.form.name',
                component: 'ContactForm',
                source: SOURCE,
              })}
            />
          </div>
          <div className="space-y-1 text-xs">
            <label
              htmlFor="contact-phone"
              className="font-bold text-slate-700 dark:text-slate-300 block"
            >
              Teléfono / WhatsApp:
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              className={inputClass}
              placeholder="Ej. 7000-0000"
              {...uiMeta({
                id: 'contacto.form.phone',
                component: 'ContactForm',
                source: SOURCE,
              })}
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label
            htmlFor="contact-subject"
            className="font-bold text-slate-700 dark:text-slate-300 block"
          >
            Motivo de Consulta:
          </label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={(event) => setField('subject', event.target.value)}
            className={inputClass}
            {...uiMeta({
              id: 'contacto.form.subject',
              component: 'ContactForm',
              source: SOURCE,
            })}
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 text-xs">
          <label
            htmlFor="contact-message"
            className="font-bold text-slate-700 dark:text-slate-300 block"
          >
            Mensaje o Detalle:
          </label>
          <textarea
            id="contact-message"
            rows={4}
            value={form.message}
            onChange={(event) => setField('message', event.target.value)}
            className={inputClass}
            placeholder="Escribe aquí tu consulta..."
            {...uiMeta({
              id: 'contacto.form.message',
              component: 'ContactForm',
              source: SOURCE,
            })}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-whatsapp hover:bg-whatsapp-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          {...uiMeta({
            id: 'contacto.form.submit',
            component: 'ContactForm',
            source: SOURCE,
          })}
        >
          <i className="fa-brands fa-whatsapp text-lg" />
          <span>Enviar Consulta por WhatsApp</span>
        </button>
      </form>
    </div>
  )
}
