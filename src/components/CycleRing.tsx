import type { ReactNode } from 'react'
import type { CycleStatus } from '../lib/cycle'

/** Anillo tipo "reloj del ciclo": muestra en qué punto del ciclo va,
 *  coloreado por la fase actual. Limpio, en paleta lila.
 *  `center` permite poner algo (p.ej. el gatito) en el centro del anillo. */
export default function CycleRing({
  status,
  size = 168,
  center,
}: {
  status: CycleStatus
  size?: number
  center?: ReactNode
}) {
  const R = 52
  const C = 2 * Math.PI * R
  const prog =
    status.hasData && status.dayOfCycle ? Math.min(1, status.dayOfCycle / Math.max(1, status.avgCycle)) : 0
  const color = status.phase?.color ?? '#b892ec'

  // ángulo del knob y de la ovulación (para el puntito ✨)
  const toXY = (frac: number, r = R) => {
    const a = frac * 2 * Math.PI - Math.PI / 2
    return { x: 70 + r * Math.cos(a), y: 70 + r * Math.sin(a) }
  }
  const knob = toXY(prog)
  const ovFrac = status.avgCycle ? (status.avgCycle - 14) / status.avgCycle : null
  const ov = ovFrac != null && ovFrac > 0 && ovFrac < 1 ? toXY(ovFrac) : null

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 140 140" width={size} height={size}>
        {/* pista */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border-soft)" strokeWidth="10" />
        {/* progreso de la fase */}
        {status.hasData && (
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${C * prog} ${C}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dasharray .6s ease, stroke .4s ease' }}
          />
        )}
        {/* punto de ovulación (fértil) */}
        {ov && status.fertileStart && (
          <circle cx={ov.x} cy={ov.y} r="3.4" fill="#b892ec" stroke="#fff" strokeWidth="1" />
        )}
        {/* knob del día actual */}
        {status.hasData && <circle cx={knob.x} cy={knob.y} r="6" fill={color} stroke="#fff" strokeWidth="2.5" />}
      </svg>
      {/* centro */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: center ? 'auto' : 'none',
        }}
      >
        {center ? (
          center
        ) : status.hasData && status.phase ? (
          <>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{status.phase.emoji}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
              Día {status.dayOfCycle}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: status.phase.color }}>{status.phase.label}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 26, lineHeight: 1 }}>🌙</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-soft)', marginTop: 4 }}>Tu ciclo</span>
          </>
        )}
      </div>
    </div>
  )
}
