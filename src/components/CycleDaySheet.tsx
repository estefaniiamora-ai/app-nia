import { useState } from 'react'
import { useApp } from '../store/store'
import type { FlowLevel } from '../data/types'
import { isBled } from '../lib/cycle'

/** Hoja para ver/editar UN día del ciclo. Todo es opcional y suave.
 *  El ánimo se describe con CUALQUIER emoji del teclado. Sin burbujas:
 *  controles segmentados + desplegable de síntomas (organizado y limpio). */
const FLOWS: { v: FlowLevel; label: string }[] = [
  { v: 'light', label: 'Ligero' },
  { v: 'medium', label: 'Medio' },
  { v: 'heavy', label: 'Abundante' },
]
const PAINS: { v: number; label: string }[] = [
  { v: 2, label: 'Leve' },
  { v: 5, label: 'Medio' },
  { v: 8, label: 'Fuerte' },
]
const SYMPTOM_LIST = ['Cólicos', 'Cabeza', 'Hinchazón', 'Cansancio', 'Antojos', 'Sensible', 'Acné', 'Náuseas', 'Espalda']

function prettyDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} de ${meses[d.getMonth()]}`
}

/** Toma el último "grafema" (para admitir emojis compuestos como 🤷🏻‍♀️). */
function lastGrapheme(v: string): string {
  if (!v) return ''
  try {
    const Seg = (Intl as unknown as { Segmenter?: new () => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter
    if (Seg) {
      const segs = Array.from(new Seg().segment(v))
      return segs.length ? segs[segs.length - 1].segment : ''
    }
  } catch {
    /* sin Segmenter: caemos al modo simple */
  }
  const arr = Array.from(v)
  return arr[arr.length - 1] ?? ''
}

export default function CycleDaySheet({ date, onClose }: { date: string; onClose: () => void }) {
  const { cycle, markBled, logCycleDay } = useApp()
  const bled = isBled(cycle, date)
  const log = cycle.logs[date] ?? {}
  const [symOpen, setSymOpen] = useState(false)
  const selectedSyms = log.symptoms ?? []

  const toggleSymptom = (s: string) => {
    const next = selectedSyms.includes(s) ? selectedSyms.filter((x) => x !== s) : [...selectedSyms, s]
    logCycleDay(date, { symptoms: next })
  }

  return (
    <div className="cyc-backdrop" onClick={onClose}>
      <div className="cyc-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cyc-sheet__grip" />
        <h3 className="cyc-sheet__title">{prettyDate(date)}</h3>

        {/* ¿Te llegó? (lo único que suma a la racha) */}
        <button className={`cyc-bled ${bled ? 'cyc-bled--on' : ''}`} onClick={() => markBled(date, !bled)}>
          <span>{bled ? '🌙 Este día tuviste tu regla' : '¿Te llegó este día?'}</span>
          <span className="cyc-bled__toggle">{bled ? 'Sí' : 'Marcar'}</span>
        </button>

        {/* Flujo (segmentado) */}
        {bled && (
          <div className="cyc-group">
            <p className="cyc-label">Flujo</p>
            <div className="cyc-seg">
              {FLOWS.map((f) => (
                <button
                  key={f.v}
                  className={`cyc-seg__opt ${log.flow === f.v ? 'is-on' : ''}`}
                  onClick={() => logCycleDay(date, { flow: log.flow === f.v ? undefined : f.v })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ánimo con cualquier emoji del teclado */}
        <div className="cyc-group">
          <p className="cyc-label">
            ¿Cómo te sentiste? <span className="cyc-opt">un emoji, el que quieras</span>
          </p>
          <div className="cyc-emojiwrap">
            <input
              className="cyc-emojiinput"
              value={log.mood ?? ''}
              onChange={(e) => logCycleDay(date, { mood: lastGrapheme(e.target.value) })}
              placeholder="🙂"
              aria-label="Elige un emoji para el día"
            />
            <span className="cyc-emojihint">
              Toca y elige el emoji que describa tu día 💜
              {log.mood && (
                <button className="cyc-emojiclear" onClick={() => logCycleDay(date, { mood: undefined })}>
                  Quitar
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Dolor (segmentado) */}
        <div className="cyc-group">
          <p className="cyc-label">Dolor <span className="cyc-opt">opcional</span></p>
          <div className="cyc-seg">
            {PAINS.map((p) => (
              <button
                key={p.v}
                className={`cyc-seg__opt ${log.pain === p.v ? 'is-on' : ''}`}
                onClick={() => logCycleDay(date, { pain: log.pain === p.v ? undefined : p.v })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Síntomas (desplegable con casillas) */}
        <div className="cyc-group">
          <button className="cyc-drop" onClick={() => setSymOpen((o) => !o)}>
            <span>Síntomas {selectedSyms.length > 0 && <b className="cyc-drop__n">{selectedSyms.length}</b>}</span>
            <span className={`cyc-drop__chev ${symOpen ? 'is-open' : ''}`}>⌄</span>
          </button>
          {selectedSyms.length > 0 && !symOpen && (
            <p className="cyc-symsel">{selectedSyms.join(' · ')}</p>
          )}
          {symOpen && (
            <div className="cyc-symlist">
              {SYMPTOM_LIST.map((s) => {
                const on = selectedSyms.includes(s)
                return (
                  <button key={s} className="cyc-symrow" onClick={() => toggleSymptom(s)}>
                    <span>{s}</span>
                    <span className={`cyc-check ${on ? 'is-on' : ''}`}>{on ? '✓' : ''}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Notita */}
        <div className="cyc-group">
          <p className="cyc-label">Notita <span className="cyc-opt">opcional</span></p>
          <textarea
            className="cyc-note"
            defaultValue={log.note ?? ''}
            placeholder="Algo que quieras recordar de hoy…"
            onBlur={(e) => logCycleDay(date, { note: e.target.value.trim() })}
          />
        </div>

        <button className="btn btn--block cyc-done" onClick={onClose}>
          Listo 💜
        </button>
      </div>
    </div>
  )
}
