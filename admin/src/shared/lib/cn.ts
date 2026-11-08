/** Une clases Tailwind completas descartando valores falsy. Nunca concatena fragmentos de clase. */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')
