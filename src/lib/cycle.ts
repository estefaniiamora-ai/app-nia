/* ===========================================================
   Lógica del ciclo de Nia — rincón íntimo y delicado.
   Los días con regla (cycle.bledDays) son la fuente de verdad;
   los periodos (rangos), las fases y las predicciones se DERIVAN.
   La predicción APRENDE del promedio real de sus ciclos.
   (Portado y suavizado del módulo viejo, sin la parte de gym.)
   =========================================================== */
import { localDayKey, daysBetween } from './date'
import type { Cycle } from '../data/types'

export type PhaseType = 'menstrual' | 'folicular' | 'ovulacion' | 'lutea'

export interface Phase {
  type: PhaseType
  label: string
  emoji: string
  color: string        // color de la fase (paleta lila de Nia)
  soft: string         // versión suave (fondos)
  message: string      // frase tierna
}

export interface PeriodRange {
  start: string        // 'YYYY-MM-DD'
  end: string
}

export interface CycleStatus {
  hasData: boolean
  bleeding: boolean            // regla hoy
  dayOfCycle: number | null
  phase: Phase | null
  nextPeriod: string | null
  daysUntilNext: number | null // negativo = atraso
  ovulation: string | null
  fertileStart: string | null
  fertileEnd: string | null
  avgCycle: number
  avgPeriod: number
}

const DEFAULT_CYCLE = 28
const DEFAULT_PERIOD = 5

/* ---------- helpers de fecha ---------- */
export function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return localDayKey(d.getTime())
}

/* ---------- derivar periodos de los días con regla ---------- */
export function periods(cycle: Cycle): PeriodRange[] {
  const days = [...(cycle.bledDays ?? [])].sort()
  const out: PeriodRange[] = []
  for (const d of days) {
    const last = out[out.length - 1]
    if (last && daysBetween(last.end, d) === 0) continue // duplicado
    if (last && daysBetween(last.end, d) === 1) last.end = d
    else out.push({ start: d, end: d })
  }
  return out
}

export function lastPeriodStart(cycle: Cycle): string | null {
  const ps = periods(cycle)
  return ps.length ? ps[ps.length - 1].start : null
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Duración media del ciclo APRENDIDA de sus inicios reales (o 28 si aún no hay).
 *  Usa la MEDIANA (robusta al ruido) y solo cuenta saltos fisiológicos (20–40 d),
 *  así registros irregulares del pasado no disparan la predicción. */
export function avgCycleLength(cycle: Cycle): number {
  if (cycle.avgCycle && cycle.avgCycle > 0) return cycle.avgCycle
  const ps = periods(cycle)
  if (ps.length < 2) return DEFAULT_CYCLE
  const gaps: number[] = []
  for (let i = 1; i < ps.length; i++) {
    const g = daysBetween(ps[i - 1].start, ps[i].start)
    if (g >= 20 && g <= 40) gaps.push(g)
  }
  if (!gaps.length) return DEFAULT_CYCLE
  return Math.round(median(gaps.slice(-6)))
}

/** Duración media del periodo (días de regla), ignorando rachas ruidosas (>10 d). */
export function avgPeriodLength(cycle: Cycle): number {
  if (cycle.avgPeriod && cycle.avgPeriod > 0) return cycle.avgPeriod
  const ps = periods(cycle)
  const lens = ps.map((p) => daysBetween(p.start, p.end) + 1).filter((n) => n >= 2 && n <= 10)
  if (!lens.length) return DEFAULT_PERIOD
  return Math.round(median(lens.slice(-6)))
}

export function isBled(cycle: Cycle, day: string): boolean {
  return (cycle.bledDays ?? []).includes(day)
}

/* ---------- fases (paleta lila, tono tierno) ---------- */
const PHASE_MSGS: Record<PhaseType, string[]> = {
  menstrual: ['Hoy toca mimarte 🤍', 'Descansa y toma agüita 💧', 'Tu cuerpo se renueva, ve con calma 🌙'],
  folicular: ['Tu energía va despertando 🌱', 'Buen momento para empezar cosas ✨', 'Te sientes con brío 🌿'],
  ovulacion: ['Estás radiante hoy ✨', 'Te sientes magnética 💫', 'Brillas desde adentro 🌟'],
  lutea:     ['Vamos con calma 🌷', 'Prioriza lo tranquilo 🍵', 'Cuídate con ternura 💜'],
}
const PHASE_META: Record<PhaseType, Omit<Phase, 'message'>> = {
  menstrual: { type: 'menstrual', label: 'Menstrual', emoji: '🌙', color: '#ff8fb8', soft: 'rgba(255,143,184,0.16)' },
  folicular: { type: 'folicular', label: 'Folicular', emoji: '🌱', color: '#5fc9a8', soft: 'rgba(95,201,168,0.16)' },
  ovulacion: { type: 'ovulacion', label: 'Ovulación', emoji: '✨', color: '#b892ec', soft: 'rgba(184,146,236,0.18)' },
  lutea:     { type: 'lutea', label: 'Lútea', emoji: '🌷', color: '#9b7bff', soft: 'rgba(155,123,255,0.16)' },
}

function makePhase(type: PhaseType, today: string): Phase {
  const msgs = PHASE_MSGS[type]
  // frase estable durante el día, pero rota
  const idx = Math.abs(daysBetween('2020-01-01', today)) % msgs.length
  return { ...PHASE_META[type], message: msgs[idx] }
}

function phaseTypeFor(day: number, avgP: number, avgC: number, bleeding: boolean): PhaseType {
  const ov = avgC - 14 // ovulación ~14 días antes de la próxima (fase lútea estable)
  if (bleeding || day <= avgP) return 'menstrual'
  if (day < ov - 2) return 'folicular'
  if (day <= ov + 1) return 'ovulacion'
  return 'lutea'
}

/* ---------- estado del ciclo hoy (o en una fecha dada) ---------- */
export function cycleStatus(cycle: Cycle, today: string = localDayKey()): CycleStatus {
  const avgCycle = avgCycleLength(cycle)
  const avgPeriod = avgPeriodLength(cycle)
  const lastStart = lastPeriodStart(cycle)
  const bleeding = isBled(cycle, today)

  if (!lastStart) {
    return {
      hasData: false, bleeding, dayOfCycle: null, phase: null,
      nextPeriod: null, daysUntilNext: null, ovulation: null,
      fertileStart: null, fertileEnd: null, avgCycle, avgPeriod,
    }
  }

  let dayOfCycle = daysBetween(lastStart, today) + 1
  if (dayOfCycle < 1) dayOfCycle = 1

  const nextPeriod = addDays(lastStart, avgCycle)
  const daysUntilNext = daysBetween(today, nextPeriod)
  const ovulation = addDays(nextPeriod, -14)
  const fertileStart = addDays(ovulation, -4)
  const fertileEnd = addDays(ovulation, 1)

  const phase = makePhase(phaseTypeFor(dayOfCycle, avgPeriod, avgCycle, bleeding), today)

  return {
    hasData: true, bleeding, dayOfCycle, phase,
    nextPeriod, daysUntilNext, ovulation, fertileStart, fertileEnd,
    avgCycle, avgPeriod,
  }
}

/** ¿La fecha cae en la ventana fértil / es el día de ovulación? (ciclo actual). */
export function fertilityOn(status: CycleStatus, day: string): { fertile: boolean; peak: boolean } {
  if (!status.fertileStart || !status.fertileEnd) return { fertile: false, peak: false }
  const fertile = day >= status.fertileStart && day <= status.fertileEnd
  const peak = status.ovulation === day
  return { fertile, peak }
}

/** ¿La fecha cae en la regla ESTIMADA de la próxima vez? (para el calendario). */
export function predictedPeriodOn(status: CycleStatus, day: string): boolean {
  if (!status.nextPeriod) return false
  const end = addDays(status.nextPeriod, Math.max(1, status.avgPeriod) - 1)
  return day >= status.nextPeriod && day <= end
}

/* ---------- semáforo de regularidad (con SU promedio real) ---------- */
export function regularity(avgCycle: number): { label: string; tone: 'ok' | 'medio' | 'ojo'; desc: string } {
  if (avgCycle >= 26 && avgCycle <= 30)
    return { label: 'Regular', tone: 'ok', desc: `Tus ciclos rondan los ${avgCycle} días. Muy estable 🌿` }
  if (avgCycle >= 21 && avgCycle <= 35)
    return { label: 'Variable', tone: 'medio', desc: `Tus ciclos son de ~${avgCycle} días, dentro de lo normal.` }
  return { label: 'Irregular', tone: 'ojo', desc: `Tus ciclos varían bastante (~${avgCycle} días). Si te incomoda, coméntalo con tu doctora 💜` }
}

/* ---------- el gato según la fase (integración con Nia) ---------- */
export function phaseCat(phase: PhaseType | null): { mood: string; speech: string } {
  switch (phase) {
    case 'menstrual': return { mood: 'idle', speech: 'aquí estoy contigo 🤍' }
    case 'folicular': return { mood: 'happy', speech: '¡con energía! 🌱' }
    case 'ovulacion': return { mood: 'celebrate', speech: '¡estás radiante! ✨' }
    case 'lutea':     return { mood: 'idle', speech: 'con calma, bonita 🌷' }
    default:          return { mood: 'idle', speech: 'cuidémonos juntas 🌙' }
  }
}

/* ---------- opciones del check-in diario (tono delicado) ----------
   Cada opción suma la racha; `bled` dice si marca regla ese día. */
export interface CheckInOption {
  id: string
  label: string
  bled: boolean
  tone: 'soft' | 'moon' | 'done'
}

export function checkInOptions(status: CycleStatus, today: string, cycle: Cycle): CheckInOption[] {
  const bledToday = isBled(cycle, today)
  if (bledToday) {
    return [
      { id: 'sigo', label: 'Sigo 🌙', bled: true, tone: 'moon' },
      { id: 'termino', label: 'Ya terminó 🤍', bled: false, tone: 'done' },
    ]
  }
  const nearPeriod =
    !status.hasData ||
    (status.daysUntilNext !== null && status.daysUntilNext <= 2) ||
    status.phase?.type === 'menstrual'

  if (nearPeriod) {
    return [
      { id: 'aun', label: 'Aún nada ⏳', bled: false, tone: 'soft' },
      { id: 'llego', label: 'Me llegó 🌙', bled: true, tone: 'moon' },
    ]
  }
  // mitad del ciclo: primero lo suave, la regla queda discreta
  return [
    { id: 'bien', label: 'Todo bien ✨', bled: false, tone: 'soft' },
    { id: 'llego', label: 'Me llegó 🌙', bled: true, tone: 'moon' },
  ]
}

/** Título del check-in en el Inicio: SIEMPRE neutral y tierno, nunca expone la
 *  fase ni el estado del ciclo (la pantalla principal es "pública"). */
export function checkInTitle(cycle: Cycle, today: string): string {
  return isBled(cycle, today) ? '¿Cómo vas hoy?' : '¿Cómo te sientes hoy?'
}
