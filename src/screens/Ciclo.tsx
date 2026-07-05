import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import { useSheets } from '../components/SheetsContext'
import { localDayKey } from '../lib/date'
import {
  cycleStatus,
  fertilityOn,
  predictedPeriodOn,
  regularity,
  phaseCat,
} from '../lib/cycle'
import Cat, { type CatMood } from '../components/Cat/Cat'
import { effectiveLook } from '../data/shop'
import CycleRing from '../components/CycleRing'
import CycleDaySheet from '../components/CycleDaySheet'
import './Ciclo.css'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fmt(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
}

export default function Ciclo() {
  const { cycle, gamification, goalsMet, updateCycle } = useApp()
  const { addOpen } = useSheets()
  const navigate = useNavigate()
  const today = localDayKey()
  const status = useMemo(() => cycleStatus(cycle, today), [cycle, today])
  const bledSet = useMemo(() => new Set(cycle.bledDays ?? []), [cycle.bledDays])
  const look = useMemo(
    () => effectiveLook(gamification, new Date().getMonth() + 1, goalsMet),
    [gamification, goalsMet],
  )
  const phaseMood = phaseCat(status.phase?.type ?? null).mood as CatMood

  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState<string | null>(null)

  const reg = status.hasData ? regularity(status.avgCycle) : null

  // ---- calendario del mes ----
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const firstDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7 // 0 = lunes
  const changeMonth = (delta: number) => {
    setYm((p) => {
      const d = new Date(p.y, p.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <main className="screen ciclo">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">‹</button>
        <div style={{ flex: 1 }}>
          <h1>Mi Ciclo 🌙</h1>
          <p className="screen-sub">Tu rincón íntimo · privado, solo tuyo</p>
        </div>
      </div>

      {/* Anillo + fase */}
      <section
        className="card ciclo-hero"
        style={status.phase ? { background: `radial-gradient(120% 120% at 50% 0%, ${status.phase.soft}, transparent 70%), var(--surface)` } : undefined}
      >
        <CycleRing
          status={status}
          size={188}
          center={
            // mientras hay una hoja abierta (nuevo movimiento) se esconde este
            // gato para no ver dos a la vez; el anillo muestra su centro normal
            addOpen ? undefined : (
              <div className="ciclo-ringcat">
                <Cat size={104} mood={phaseMood} equipped={look.equipped} skin={look.skin} />
              </div>
            )
          }
        />
        {status.hasData && status.phase ? (
          <>
            <p className="ciclo-daylabel">
              Día {status.dayOfCycle} · <span style={{ color: status.phase.color }}>{status.phase.label} {status.phase.emoji}</span>
            </p>
            <p className="ciclo-phasemsg">“{status.phase.message}”</p>
            {status.bleeding && <span className="ciclo-active">🩸 En tu regla ahora</span>}
          </>
        ) : (
          <p className="ciclo-phasemsg">
            Marca cuándo te llega y aquí verás tus fases, tu calendario y cuándo vuelve 🌙
          </p>
        )}
      </section>

      {/* Predicciones */}
      {status.hasData && (
        <div className="ciclo-preds">
          <div className="ciclo-pred">
            <span className="ciclo-pred__ic">🌙</span>
            <span className="ciclo-pred__lbl">Próxima regla</span>
            <span className="ciclo-pred__val">
              {status.daysUntilNext != null && status.daysUntilNext < 0
                ? 'puede ser pronto'
                : status.daysUntilNext === 0
                  ? 'quizá hoy'
                  : `en ${status.daysUntilNext} ${status.daysUntilNext === 1 ? 'día' : 'días'}`}
            </span>
            <span className="ciclo-pred__sub">{status.nextPeriod ? fmt(status.nextPeriod) : ''}</span>
          </div>

          {cycle.showFertility && status.fertileStart && status.fertileEnd && (
            <div className="ciclo-pred ciclo-pred--fert">
              <span className="ciclo-pred__ic">✨</span>
              <span className="ciclo-pred__lbl">Días fértiles</span>
              <span className="ciclo-pred__val">{fmt(status.fertileStart)}–{fmt(status.fertileEnd)}</span>
              <span className="ciclo-pred__sub">ovulación ~{status.ovulation ? fmt(status.ovulation) : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Regularidad (con su promedio real) */}
      {reg && (
        <section className={`card ciclo-reg ciclo-reg--${reg.tone}`}>
          <div className="spread">
            <b style={{ fontSize: 14 }}>Tus patrones ✨</b>
            <span className="ciclo-regpill">{reg.label}</span>
          </div>
          <p className="screen-sub" style={{ marginTop: 4 }}>{reg.desc}</p>
          <p className="screen-sub" style={{ marginTop: 2 }}>
            Ciclo ~{status.avgCycle} días · regla ~{status.avgPeriod} días
          </p>
        </section>
      )}

      {/* Calendario */}
      <section className="card">
        <div className="spread ciclo-calhead">
          <button className="iconbtn" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button>
          <b>{MESES[ym.m]} {ym.y}</b>
          <button className="iconbtn" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button>
        </div>

        <div className="ciclo-cal">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span key={i} className="ciclo-dow">{d}</span>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dStr = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const bled = bledSet.has(dStr)
            const fert = cycle.showFertility ? fertilityOn(status, dStr) : { fertile: false, peak: false }
            const predicted = predictedPeriodOn(status, dStr)
            const isToday = dStr === today
            const dayLog = cycle.logs[dStr]
            const dayEmoji = dayLog?.mood
            const hasLog = !!dayLog && Object.keys(dayLog).length > 0

            let cls = 'ciclo-cell'
            if (bled) cls += ' ciclo-cell--bled'
            else if (fert.peak) cls += ' ciclo-cell--ov'
            else if (fert.fertile) cls += ' ciclo-cell--fert'
            else if (predicted) cls += ' ciclo-cell--pred'
            if (isToday) cls += ' ciclo-cell--today'

            return (
              <button key={dStr} className={cls} onClick={() => setSelected(dStr)}>
                <span className="ciclo-cell__n">{day}</span>
                {dayEmoji ? (
                  <span className="ciclo-emoji">{dayEmoji}</span>
                ) : (hasLog || bled) ? (
                  <i className="ciclo-dot" />
                ) : null}
              </button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="ciclo-legend">
          <span><i className="lg lg--bled" /> Regla</span>
          {cycle.showFertility && <span><i className="lg lg--ov" /> Ovulación</span>}
          {cycle.showFertility && <span><i className="lg lg--fert" /> Fértil</span>}
          <span><i className="lg lg--pred" /> Estimado</span>
        </div>
        {cycle.showFertility && (
          <p className="ciclo-disclaimer">La fertilidad es una estimación; tu cuerpo puede variar 💜</p>
        )}
      </section>

      {/* Ajuste de fertilidad */}
      <section className="card spread">
        <span className="grow">
          <b style={{ fontSize: 14 }}>Mostrar días fértiles ✨</b>
          <p className="screen-sub">Ovulación y ventana fértil en el calendario</p>
        </span>
        <button
          className={`cyc-switch ${cycle.showFertility ? 'cyc-switch--on' : ''}`}
          onClick={() => updateCycle({ showFertility: !cycle.showFertility })}
          aria-label="Mostrar fertilidad"
        >
          <span className="cyc-switch__dot" />
        </button>
      </section>

      <p className="ciclo-privacy">🔒 Tus datos del ciclo son solo tuyos, guardados de forma privada.</p>

      {selected && <CycleDaySheet date={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
