import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, ...rest }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 pt-1 cursor-pointer">
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-slate-300 accent-brand cursor-pointer"
        {...rest}
      />
      <span className="font-bold text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  )
}
