/* Utilidades de fecha en español (Colombia). */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** 'YYYY-MM-DD' en hora local (para rachas/días). */
export function localDayKey(ts: number = Date.now()): string {
  const d = new Date(ts)
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Clave de mes 'YYYY-MM'. */
export function monthKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

/** Diferencia en días entre dos 'YYYY-MM-DD'. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

export function formatDateFull(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  let h = d.getHours()
  const min = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'p.m.' : 'a.m.'
  h = h % 12 || 12
  return `${h}:${min} ${ampm}`
}

/** "Hoy", "Ayer" o la fecha. */
export function relativeDay(ts: number): string {
  const today = localDayKey()
  const key = localDayKey(ts)
  const diff = daysBetween(key, today)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return formatDate(ts)
}

export function monthLabel(ts: number): string {
  const d = new Date(ts)
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export interface PeriodRange {
  start: number
  end: number
  label: string
}

/** Rango de un periodo (semana/mes) con desplazamiento (0 = actual, -1 anterior). */
export function periodRange(unit: 'week' | 'month', offset: number): PeriodRange {
  const now = new Date()
  if (unit === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1).getTime() - 1
    const sameYear = start.getFullYear() === now.getFullYear()
    const label =
      offset === 0
        ? 'Este mes'
        : `${MESES[start.getMonth()]}${sameYear ? '' : ' ' + start.getFullYear()}`
    return { start: start.getTime(), end, label }
  }
  // semana (lunes a domingo)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = (today.getDay() + 6) % 7 // 0 = lunes
  const start = new Date(today)
  start.setDate(today.getDate() - dow + offset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  const label =
    offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana pasada' : `${start.getDate()} ${MESES[start.getMonth()].slice(0, 3)}`
  return { start: start.getTime(), end: end.getTime() - 1, label }
}
