/* ===========================================================
   Cálculos del registro de tokens de trabajo + metas semanales.
   Todo se DERIVA de los registros (tokenEntries): así, si ella
   edita un día, todo se recalcula solo (récords, metas, racha).
   Las semanas son de lunes a domingo (igual que el resto de la app).
   =========================================================== */
import { localDayKey, monthKey, periodRange, formatDate } from '../lib/date'
import type { TokenEntry, WorkStats } from './types'

/** Clave de la semana = fecha (YYYY-MM-DD) del LUNES de esa semana. */
export function weekKeyOf(ts: number): string {
  const d = new Date(ts)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (day.getDay() + 6) % 7 // 0 = lunes
  day.setDate(day.getDate() - dow)
  return localDayKey(day.getTime())
}

function sumBy(entries: TokenEntry[], keyOf: (ts: number) => string): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of entries) m.set(keyOf(e.date), (m.get(keyOf(e.date)) ?? 0) + e.tokens)
  return m
}

export const totalsByDay = (e: TokenEntry[]) => sumBy(e, (ts) => localDayKey(ts))
export const totalsByWeek = (e: TokenEntry[]) => sumBy(e, weekKeyOf)
export const totalsByMonth = (e: TokenEntry[]) => sumBy(e, monthKey)

/** Meta efectiva de una semana: la congelada si existe, si no la meta actual. */
export function effectiveGoal(weekKey: string, ws: WorkStats): number {
  return ws.weekGoals[weekKey] ?? ws.weeklyGoal
}

/** Nº de semanas donde se cumplió la meta (puede subir o bajar al editar). */
export function goalsMet(entries: TokenEntry[], ws: WorkStats): number {
  let n = 0
  for (const [wk, total] of totalsByWeek(entries)) {
    const g = effectiveGoal(wk, ws)
    if (g > 0 && total >= g) n++
  }
  return n
}

export function bestDay(entries: TokenEntry[]): number {
  let best = 0
  for (const v of totalsByDay(entries).values()) best = Math.max(best, v)
  return best
}

export function bestWeek(entries: TokenEntry[]): number {
  let best = 0
  for (const v of totalsByWeek(entries).values()) best = Math.max(best, v)
  return best
}

/** Racha de días seguidos registrando (hasta hoy o ayer). */
export function workStreak(entries: TokenEntry[]): number {
  const set = new Set(entries.map((e) => localDayKey(e.date)))
  if (set.size === 0) return 0
  const today = new Date()
  const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!set.has(localDayKey(cur.getTime()))) {
    cur.setDate(cur.getDate() - 1) // aún no registra hoy: cuenta hasta ayer
    if (!set.has(localDayKey(cur.getTime()))) return 0
  }
  let streak = 0
  while (set.has(localDayKey(cur.getTime()))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

/* ----------------- Rangos de periodo (día / semana / mes) ----------------- */
export type Unit = 'day' | 'week' | 'month'

export interface Range {
  start: number
  end: number
  label: string
}

export function rangeFor(unit: Unit, offset: number): Range {
  if (unit === 'day') {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const start = d.getTime()
    const label = offset === 0 ? 'Hoy' : offset === -1 ? 'Ayer' : formatDate(start)
    return { start, end: start + 86400000 - 1, label }
  }
  const r = periodRange(unit, offset)
  return { start: r.start, end: r.end, label: r.label }
}

export function tokensInRange(entries: TokenEntry[], start: number, end: number): number {
  let sum = 0
  for (const e of entries) if (e.date >= start && e.date <= end) sum += e.tokens
  return sum
}

/** Mejor día dentro de un rango (para "tu mejor día fue…"). */
export function bestDayInRange(entries: TokenEntry[], start: number, end: number): { day: string; tokens: number } | null {
  const m = new Map<string, number>()
  for (const e of entries) {
    if (e.date < start || e.date > end) continue
    const k = localDayKey(e.date)
    m.set(k, (m.get(k) ?? 0) + e.tokens)
  }
  let best: { day: string; tokens: number } | null = null
  for (const [day, tokens] of m) if (!best || tokens > best.tokens) best = { day, tokens }
  return best
}

/** Días con registro dentro de un rango (para promedios). */
export function daysWithEntriesInRange(entries: TokenEntry[], start: number, end: number): number {
  const set = new Set<string>()
  for (const e of entries) if (e.date >= start && e.date <= end) set.add(localDayKey(e.date))
  return set.size
}

/** Progreso de la semana (por defecto la actual) contra la meta vigente. */
export function weekProgress(entries: TokenEntry[], ws: WorkStats, offset = 0) {
  const r = rangeFor('week', offset)
  const total = tokensInRange(entries, r.start, r.end)
  const wk = weekKeyOf(r.start)
  const goal = offset === 0 ? ws.weeklyGoal : effectiveGoal(wk, ws)
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
  const remaining = Math.max(0, goal - total)
  return { total, goal, pct, remaining, met: goal > 0 && total >= goal, range: r }
}

/**
 * Recalcula qué semanas quedan "congeladas" (premio ganado). Solo AÑADE
 * candados nuevos (nunca quita), para que subir la meta luego no quite
 * premios viejos. Devuelve el nuevo mapa o null si no cambió nada.
 */
export function lockGoalsMet(entries: TokenEntry[], ws: WorkStats): Record<string, number> | null {
  if (ws.weeklyGoal <= 0) return null
  let changed = false
  const next = { ...ws.weekGoals }
  for (const [wk, total] of totalsByWeek(entries)) {
    if (next[wk] === undefined && total >= ws.weeklyGoal) {
      next[wk] = ws.weeklyGoal
      changed = true
    }
  }
  return changed ? next : null
}
