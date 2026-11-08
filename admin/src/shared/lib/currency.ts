const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

/** Formatea montos en USD ($0.00), moneda de curso legal en El Salvador. */
export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  return usd.format(value)
}
