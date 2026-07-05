/* ===========================================================
   Recordatorios de pago: avanzar la fecha según la frecuencia,
   calcular el estado (vencido / hoy / pronto / más adelante),
   ordenar y contar pendientes.
   =========================================================== */
import type { PaymentReminder, ReminderFreq } from './types'
import { localDayKey, daysBetween } from '../lib/date'

export const FREQ_LABEL: Record<ReminderFreq, string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
  bimonthly: 'cada 2 meses',
}

/** Próxima fecha sumando la frecuencia. */
export function advanceDate(ts: number, freq: ReminderFreq): number {
  const d = new Date(ts)
  if (freq === 'weekly') d.setDate(d.getDate() + 7)
  else if (freq === 'biweekly') d.setDate(d.getDate() + 15)
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setMonth(d.getMonth() + 2) // bimonthly
  return d.getTime()
}

export type ReminderState = 'overdue' | 'today' | 'soon' | 'later'
export interface ReminderStatus {
  days: number
  state: ReminderState
  label: string
}

export function reminderStatus(r: PaymentReminder, today: string = localDayKey()): ReminderStatus {
  const days = daysBetween(today, localDayKey(r.nextDate))
  if (days < 0) {
    return { days, state: 'overdue', label: days === -1 ? 'vencido ayer' : `vencido hace ${-days} días` }
  }
  if (days === 0) return { days, state: 'today', label: 'hoy' }
  if (days <= 5) return { days, state: 'soon', label: days === 1 ? 'mañana' : `en ${days} días` }
  return { days, state: 'later', label: `en ${days} días` }
}

/** Recordatorios vivos (activos y no completados). */
export function liveReminders(rs: PaymentReminder[]): PaymentReminder[] {
  return rs.filter((r) => r.active && !r.done)
}

/** Ordenados: primero los vivos por fecha más próxima, luego los inactivos/hechos. */
export function sortedReminders(rs: PaymentReminder[]): PaymentReminder[] {
  return [...rs].sort((a, b) => {
    const av = a.active && !a.done ? 0 : 1
    const bv = b.active && !b.done ? 0 : 1
    return av - bv || a.nextDate - b.nextDate
  })
}

/** Cuántos pagos vivos ya vencieron o vencen hoy. */
export function pendingCount(rs: PaymentReminder[], today: string = localDayKey()): number {
  return liveReminders(rs).filter((r) => daysBetween(today, localDayKey(r.nextDate)) <= 0).length
}

/** Pagos vivos que urge avisar al entrar: atrasados, de hoy y de mañana,
 *  ordenados del más urgente al menos (fecha más próxima primero). */
export function duePopupReminders(rs: PaymentReminder[], today: string = localDayKey()): PaymentReminder[] {
  return liveReminders(rs)
    .filter((r) => daysBetween(today, localDayKey(r.nextDate)) <= 1)
    .sort((a, b) => a.nextDate - b.nextDate)
}
