import writtenNumber from 'written-number'

writtenNumber.defaults.lang = 'fr'

export const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch (e) { return '' }
}

export const formatAmount = (n) => {
  try { return Number(n || 0).toFixed(3) + ' TND' } catch (e) { return n }
}

export const amountToWords = (amount) => {
  try {
    const dinars = Math.floor(amount || 0)
    const millimes = Math.round(((amount || 0) - dinars) * 1000)
    let result = `${writtenNumber(dinars)} dinars`
    if (millimes > 0) result += ` et ${writtenNumber(millimes)} millimes`
    return result.charAt(0).toUpperCase() + result.slice(1)
  } catch (e) {
    return ''
  }
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
