import Cat from './Cat/Cat'
import './HaalandBanner.css'

/** Banner de estreno de la camiseta de Haaland (Noruega · Mundial).
 *  Aparece cada vez que se entra a la app hasta que se reclama.
 *  - Reclamar → desbloquea la camiseta en la Tienda y la deja puesta.
 *  - Saltar por ahora → se cierra, pero vuelve a salir en la próxima entrada. */
export default function HaalandBanner({
  catName,
  onClaim,
  onSkip,
}: {
  catName?: string
  onClaim: () => void
  onSkip: () => void
}) {
  const nombre = (catName || '').trim() || 'tu michi'

  return (
    <div className="haaland" role="dialog" aria-modal="true" aria-label="Nueva camiseta de Haaland">
      {/* confeti festivo */}
      <div className="haaland__confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span key={i} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
        ))}
      </div>

      <div className="haaland__card" onClick={(e) => e.stopPropagation()}>
        {/* cabecera de ocasión con los colores de Noruega */}
        <div className="haaland__header">
          <span className="haaland__ribbon">✨ NUEVO · MUNDIAL ✨</span>
          <span className="haaland__flag norflag" aria-hidden="true" />
        </div>

        {/* el gatico luciendo la camiseta */}
        <div className="haaland__stage">
          <div className="haaland__glow" aria-hidden="true" />
          <Cat size={168} equipped={['mn_noruega']} mood="celebrate" />
        </div>

        {/* placa de dorsal */}
        <div className="haaland__plate">
          <span className="haaland__plate-flag norflag" aria-hidden="true" />
          <span className="haaland__plate-name">HAALAND</span>
          <span className="haaland__plate-num">9</span>
        </div>

        <h2 className="haaland__title">¡Camiseta de Haaland desbloqueada! ⚽</h2>
        <p className="haaland__text">
          En honor a <b>Erling Haaland</b> y a Noruega en este Mundial ⚽. Ya es de{' '}
          <b>{nombre}</b>: reclámala y quédatela en tu Tienda para ponértela cuando quieras.
        </p>

        <div className="haaland__actions">
          <button className="btn btn--block haaland__claim" onClick={onClaim}>
            🎁 Reclamar camiseta
          </button>
          <button className="btn btn--ghost btn--block haaland__skip" onClick={onSkip}>
            Saltar por ahora
          </button>
        </div>
        <p className="haaland__foot">Si saltas, la camiseta te seguirá esperando la próxima vez 💛</p>
      </div>
    </div>
  )
}

/* confeti pre-calculado (sin Math.random en render → estable) */
const CONFETTI = [
  { left: 6, color: '#d5122c', delay: 0.0, dur: 2.6 },
  { left: 16, color: '#00205b', delay: 0.5, dur: 3.0 },
  { left: 27, color: '#f2c438', delay: 0.2, dur: 2.4 },
  { left: 38, color: '#ffffff', delay: 0.9, dur: 3.2 },
  { left: 49, color: '#d5122c', delay: 0.35, dur: 2.8 },
  { left: 60, color: '#00205b', delay: 0.7, dur: 2.5 },
  { left: 71, color: '#f2c438', delay: 0.15, dur: 3.1 },
  { left: 82, color: '#ffffff', delay: 0.6, dur: 2.7 },
  { left: 92, color: '#d5122c', delay: 1.0, dur: 3.0 },
  { left: 33, color: '#f2c438', delay: 1.2, dur: 2.9 },
  { left: 66, color: '#00205b', delay: 1.1, dur: 2.6 },
]
