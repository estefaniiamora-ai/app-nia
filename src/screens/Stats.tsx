import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Money from '../components/Money'
import { categoryStats, periodTotals } from '../data/selectors'
import { periodRange } from '../lib/date'
import './Stats.css'

export default function Stats() {
  const { movements, categories } = useApp()
  const navigate = useNavigate()
  const [unit, setUnit] = useState<'week' | 'month'>('month')
  const [offset, setOffset] = useState(0)

  const range = useMemo(() => periodRange(unit, offset), [unit, offset])
  const totals = useMemo(
    () => periodTotals(movements, range.start, range.end),
    [movements, range],
  )
  const stats = useMemo(
    () => categoryStats(movements, range.start, range.end),
    [movements, range],
  )
  const maxAbs = Math.max(1, ...stats.map((s) => Math.abs(s.net)))

  function catOf(id: string) {
    return categories.find((c) => c.id === id)
  }

  return (
    <main className="screen">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Estadísticas 📊</h1>
          <p className="screen-sub">En qué entra y sale tu plata</p>
        </div>
      </div>

      {/* Selector semana/mes */}
      <div className="rowflex" style={{ gap: 8, justifyContent: 'center' }}>
        <button className={`chip ${unit === 'week' ? 'chip--active' : ''}`} onClick={() => { setUnit('week'); setOffset(0) }}>
          Semana
        </button>
        <button className={`chip ${unit === 'month' ? 'chip--active' : ''}`} onClick={() => { setUnit('month'); setOffset(0) }}>
          Mes
        </button>
      </div>

      {/* Navegador de periodo */}
      <div className="period">
        <button className="iconbtn" onClick={() => setOffset((o) => o - 1)}>‹</button>
        <span className="period__label">{range.label}</span>
        <button className="iconbtn" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0}>
          ›
        </button>
      </div>

      {/* Resumen ingreso/gasto/neto */}
      <div className="statsum">
        <div className="statsum__item">
          <span className="statsum__lbl">Ingresos</span>
          <span className="statsum__val" style={{ color: 'var(--income)' }}>
            <Money value={totals.income} />
          </span>
        </div>
        <div className="statsum__item">
          <span className="statsum__lbl">Gastos</span>
          <span className="statsum__val" style={{ color: 'var(--expense)' }}>
            <Money value={totals.expense} />
          </span>
        </div>
        <div className="statsum__item">
          <span className="statsum__lbl">Balance</span>
          <span className="statsum__val">
            <Money value={totals.net} colored showPlus />
          </span>
        </div>
      </div>

      {/* Desglose por categoría */}
      {stats.length === 0 ? (
        <div className="card empty">
          <h3>Sin datos en este periodo ✨</h3>
          <p>Registra ingresos y gastos para ver tus estadísticas.</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {stats.map((s) => {
            const cat = catOf(s.categoryId)
            const pct = Math.round((Math.abs(s.net) / maxAbs) * 100)
            const pos = s.net >= 0
            return (
              <div key={s.categoryId} className="statrow">
                <div className="statrow__top">
                  <span className="statrow__name">
                    {cat?.emoji ?? '🏷️'} {cat?.name ?? 'Sin categoría'}
                  </span>
                  <span className="statrow__net">
                    <Money value={s.net} colored showPlus />
                  </span>
                </div>
                <div className="statrow__bar">
                  <div
                    className="statrow__fill"
                    style={{
                      width: `${pct}%`,
                      background: pos ? 'var(--income)' : 'var(--expense)',
                    }}
                  />
                </div>
                <div className="statrow__sub">
                  {s.income > 0 && <span style={{ color: 'var(--income)' }}>+<Money value={s.income} /></span>}
                  {s.expense > 0 && <span style={{ color: 'var(--expense)' }}>−<Money value={s.expense} /></span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
