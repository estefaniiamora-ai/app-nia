/* ===========================================================
   Dinero en COP — guardado en centavos (enteros).
   Formato colombiano: $1.250.000,00  (puntos de miles, coma decimal)
   Los decimales se muestran más pequeños en la UI (clase .dec).
   =========================================================== */

export type CurrencyCode = 'COP' | 'USD'

/** Símbolo que se muestra antes del número según la moneda. */
export function currencySymbol(currency: CurrencyCode = 'COP'): string {
  return currency === 'USD' ? 'US$' : '$'
}

export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export interface MoneyParts {
  neg: boolean
  intStr: string   // "1.250.000"
  decStr: string   // "00"
}

export function splitMoney(cents: number): MoneyParts {
  const neg = cents < 0
  const abs = Math.abs(Math.round(cents))
  const intPart = Math.floor(abs / 100)
  const decPart = abs % 100
  return {
    neg,
    intStr: intPart.toLocaleString('es-CO'),
    decStr: decPart.toString().padStart(2, '0'),
  }
}

/** Texto plano (sin estilos), p.ej. para inputs o WhatsApp. */
export function formatCOP(cents: number, withSymbol = true): string {
  const { neg, intStr, decStr } = splitMoney(cents)
  return `${neg ? '-' : ''}${withSymbol ? '$' : ''}${intStr},${decStr}`
}

/** Parsea lo que la usuaria escribe (acepta "1.250.000,50" o "1250000.5"). */
export function parseAmountToCents(raw: string): number {
  if (!raw) return 0
  let s = raw.trim().replace(/[^\d.,-]/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  // El último separador es el decimal
  const decSep = lastComma > lastDot ? ',' : lastDot > -1 ? '.' : ''
  if (decSep) {
    const intp = s.slice(0, s.lastIndexOf(decSep)).replace(/[.,]/g, '')
    const decp = s.slice(s.lastIndexOf(decSep) + 1).replace(/[.,]/g, '')
    s = `${intp}.${decp}`
  } else {
    s = s.replace(/[.,]/g, '')
  }
  const value = parseFloat(s)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}
