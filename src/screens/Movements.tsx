import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import MovementRow from '../components/MovementRow'
import { useSheets } from '../components/SheetsContext'
import { sortedDesc } from '../data/selectors'
import { relativeDay, localDayKey } from '../lib/date'
import type { Movement, MovementType } from '../data/types'
import './Movements.css'

type Filter = 'all' | MovementType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
  { key: 'transfer', label: 'Transfers' },
]

export default function Movements() {
  const { movements, accounts } = useApp()
  const { openAdd } = useSheets()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [accFilter, setAccFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = movements
    if (filter !== 'all') list = list.filter((m) => m.type === filter)
    if (accFilter !== 'all')
      list = list.filter((m) => m.accountId === accFilter || m.toAccountId === accFilter)
    return sortedDesc(list)
  }, [movements, filter, accFilter])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const activeAccounts = accounts.filter((a) => !a.archived)

  return (
    <main className="screen">
      <div className="screen-head">
        <div>
          <h1>Movimientos 📜</h1>
          <p className="screen-sub">Todo tu historial</p>
        </div>
        <button className="chip" onClick={() => navigate('/estadisticas')}>
          📊 Estadísticas
        </button>
      </div>

      {/* Dos barras desplegables: Tipo y Cuenta */}
      <div className="fsel-row">
        <FilterSelect
          value={filter}
          options={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          onChange={(k) => setFilter(k as Filter)}
        />
        {activeAccounts.length > 1 && (
          <FilterSelect
            value={accFilter}
            options={[
              { key: 'all', label: 'Todas' },
              ...activeAccounts.map((a) => ({ key: a.id, label: a.name, emoji: a.emoji })),
            ]}
            onChange={setAccFilter}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <h3>Nada por aquí ✨</h3>
          <p>{movements.length === 0 ? 'Toca el botón ＋ para registrar el primero.' : 'No hay movimientos con ese filtro.'}</p>
        </div>
      ) : (
        <div className="stack">
          {groups.map((g) => (
            <section key={g.key} className="stack" style={{ gap: 8 }}>
              <p className="t-label" style={{ paddingLeft: 4 }}>
                {g.label}
              </p>
              <div className="list">
                {g.items.map((m) => (
                  <MovementRow key={m.id} movement={m} onClick={openAdd} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

/* Barra desplegable (dropdown) para un filtro. Flota encima, se cierra al
   elegir o al tocar afuera. No hay que deslizar de lado buscando opciones. */
interface Opt {
  key: string
  label: string
  emoji?: string
}
function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: Opt[]
  onChange: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.key === value) ?? options[0]
  const active = value !== 'all'

  useEffect(() => {
    if (!open) return
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  return (
    <div className="fsel" ref={ref}>
      <button
        className={`fsel__bar ${open ? 'fsel__bar--open' : ''} ${active ? 'fsel__bar--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fsel__val">
          {current?.emoji ? `${current.emoji} ` : ''}
          {current?.label}
        </span>
        <span className="fsel__caret">▼</span>
      </button>
      {open && (
        <div className="fsel__menu no-scrollbar">
          {options.map((o) => (
            <button
              key={o.key}
              className={`fsel__opt ${o.key === value ? 'fsel__opt--on' : ''}`}
              onClick={() => {
                onChange(o.key)
                setOpen(false)
              }}
            >
              {o.emoji ? `${o.emoji} ` : ''}
              {o.label}
              {o.key === value && <span className="fsel__check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByDay(items: Movement[]) {
  const map = new Map<string, Movement[]>()
  for (const m of items) {
    const key = localDayKey(m.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    label: relativeDay(items[0].date),
    items,
  }))
}
