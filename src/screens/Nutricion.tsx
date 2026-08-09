import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from '../components/ui/Sheet'
import Cat from '../components/Cat/Cat'
import { localDayKey, daysBetween } from '../lib/date'
import { FOODS, macrosFor, searchFoods, type Food } from '../data/foods'
import { MEAL_SLOTS, type FoodLog, type MealSlot } from '../data/types'
import './Nutricion.css'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function labelDia(key: string): string {
  const hoy = localDayKey()
  const diff = daysBetween(key, hoy)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff === -1) return 'Mañana'
  const [y, m, d] = key.split('-').map(Number)
  const mismoAno = y === new Date().getFullYear()
  return `${d} de ${MESES[m - 1]}${mismoAno ? '' : ' de ' + y}`
}

function correrDia(key: string, dias: number): string {
  const d = new Date(key + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return localDayKey(d.getTime())
}

/** Metas por defecto si ella aún no ha puesto las suyas. */
const META_KCAL = 2000
const META_PROT = 90

export default function Nutricion() {
  const { foodLogs, profile, addFoodLog, updateFoodLog, deleteFoodLog, updateProfile } = useApp()
  const navigate = useNavigate()
  const [dia, setDia] = useState(localDayKey())
  const [agregando, setAgregando] = useState<MealSlot | null>(null)
  const [editando, setEditando] = useState<FoodLog | null>(null)
  const [metasAbiertas, setMetasAbiertas] = useState(false)

  const metaKcal = profile.kcalGoal ?? META_KCAL
  const metaProt = profile.proteinGoal ?? META_PROT
  // Carbos y grasas: reparto orientativo (45% y 30% de las calorías del día).
  const metaCarb = Math.round((metaKcal * 0.45) / 4)
  const metaGrasa = Math.round((metaKcal * 0.3) / 9)

  const delDia = useMemo(
    () => foodLogs.filter((f) => f.date === dia).sort((a, b) => a.createdAt - b.createdAt),
    [foodLogs, dia],
  )

  const total = useMemo(
    () =>
      delDia.reduce(
        (acc, f) => ({
          kcal: acc.kcal + f.kcal,
          protein: acc.protein + f.protein,
          carbs: acc.carbs + f.carbs,
          fat: acc.fat + f.fat,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [delDia],
  )

  const pct = Math.min(100, Math.round((total.kcal / Math.max(1, metaKcal)) * 100))
  const restan = metaKcal - total.kcal

  return (
    <main className="screen nut">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Mi Comida 🥗</h1>
          <p className="screen-sub">Lo que comes y sus nutrientes</p>
        </div>
        <button className="iconbtn" onClick={() => setMetasAbiertas(true)} aria-label="Mis metas">
          🎯
        </button>
      </div>

      {/* ----- Día ----- */}
      <div className="nut-dias">
        <button className="iconbtn" onClick={() => setDia((d) => correrDia(d, -1))} aria-label="Día anterior">
          ‹
        </button>
        <b>{labelDia(dia)}</b>
        <button
          className="iconbtn"
          onClick={() => setDia((d) => correrDia(d, 1))}
          aria-label="Día siguiente"
          disabled={dia >= localDayKey()}
          style={{ opacity: dia >= localDayKey() ? 0.35 : 1 }}
        >
          ›
        </button>
      </div>

      {/* ----- Resumen del día ----- */}
      <div className="nut-card">
        <div className="nut-card__top">
          <div>
            <span className="nut-kcal">{total.kcal.toLocaleString('es-CO')}</span>
            <span className="nut-kcal__meta"> / {metaKcal.toLocaleString('es-CO')} kcal</span>
          </div>
          <span className={`nut-restan ${restan < 0 ? 'nut-restan--pasada' : ''}`}>
            {restan >= 0 ? `te quedan ${restan.toLocaleString('es-CO')}` : `${Math.abs(restan).toLocaleString('es-CO')} de más`}
          </span>
        </div>

        <div className="nut-bar">
          <span className="nut-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="nut-macros">
          <Macro label="Proteína" valor={total.protein} meta={metaProt} clase="prot" />
          <Macro label="Carbos" valor={total.carbs} meta={metaCarb} clase="carb" />
          <Macro label="Grasas" valor={total.fat} meta={metaGrasa} clase="grasa" />
        </div>
      </div>

      {/* ----- Comidas del día ----- */}
      {MEAL_SLOTS.map((slot) => {
        const items = delDia.filter((f) => f.slot === slot.key)
        const kcalSlot = items.reduce((n, f) => n + f.kcal, 0)
        return (
          <section key={slot.key} className="nut-slot">
            <div className="nut-slot__head">
              <b>
                {slot.emoji} {slot.label}
              </b>
              <span className="nut-slot__kcal">{kcalSlot > 0 ? `${kcalSlot} kcal` : ''}</span>
              <button className="nut-slot__add" onClick={() => setAgregando(slot.key)} aria-label={`Agregar a ${slot.label}`}>
                ＋
              </button>
            </div>

            {items.length === 0 ? (
              <p className="nut-slot__vacio">Nada todavía</p>
            ) : (
              <div className="list">
                {items.map((f) => (
                  <button
                    key={f.id}
                    className="row nut-item"
                    onClick={() => setEditando(f)}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <span className="row__main">
                      <span className="row__title">{f.name}</span>
                      <span className="row__sub">
                        {f.grams} g · P {f.protein} · C {f.carbs} · G {f.fat}
                      </span>
                    </span>
                    <span className="row__right nut-item__kcal">{f.kcal}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {delDia.length === 0 && (
        <div className="nut-empty">
          <Cat size={120} mood="happy" alive={false} speech="¿qué comiste? 🍓" />
          <p className="screen-sub">
            Toca el ＋ de cada comida y busca el alimento. Yo calculo los nutrientes por ti 💗
          </p>
        </div>
      )}

      {/* ----- Hojas ----- */}
      <AgregarComida
        open={!!agregando}
        slot={agregando ?? 'desayuno'}
        onClose={() => setAgregando(null)}
        onSave={(data) => {
          addFoodLog({ ...data, date: dia, slot: agregando ?? 'desayuno' })
          setAgregando(null)
        }}
      />

      <EditarComida
        open={!!editando}
        log={editando ?? undefined}
        onClose={() => setEditando(null)}
        onSave={(log) => {
          updateFoodLog(log)
          setEditando(null)
        }}
        onDelete={() => {
          if (editando) deleteFoodLog(editando.id)
          setEditando(null)
        }}
      />

      <Sheet open={metasAbiertas} onClose={() => setMetasAbiertas(false)} title="Mis metas del día 🎯">
        <MetasForm
          kcal={metaKcal}
          prot={metaProt}
          onSave={(k, p) => {
            updateProfile({ kcalGoal: k, proteinGoal: p })
            setMetasAbiertas(false)
          }}
        />
      </Sheet>
    </main>
  )
}

function Macro({ label, valor, meta, clase }: { label: string; valor: number; meta?: number; clase: string }) {
  const pct = meta ? Math.min(100, Math.round((valor / Math.max(1, meta)) * 100)) : null
  return (
    <div className="nut-macro">
      <span className="nut-macro__lbl">{label}</span>
      <b className={`nut-macro__val nut-macro__val--${clase}`}>
        {valor} g{meta ? <span className="nut-macro__meta"> / {meta}</span> : null}
      </b>
      {pct !== null && (
        <span className="nut-macro__bar">
          <span className={`nut-macro__fill nut-macro__fill--${clase}`} style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  )
}

/* ===========================================================
   Agregar un alimento: buscar → elegir cantidad
   =========================================================== */

type DatosComida = Omit<FoodLog, 'id' | 'createdAt' | 'date' | 'slot'>

function AgregarComida({
  open,
  slot,
  onClose,
  onSave,
}: {
  open: boolean
  slot: MealSlot
  onClose: () => void
  onSave: (data: DatosComida) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [elegido, setElegido] = useState<Food | null>(null)
  const [manual, setManual] = useState(false)

  const firma = `${open}|${slot}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setBusqueda('')
    setElegido(null)
    setManual(false)
  }

  const resultados = useMemo(() => searchFoods(busqueda, 60), [busqueda])
  const titulo = MEAL_SLOTS.find((s) => s.key === slot)?.label ?? 'Comida'

  return (
    <Sheet open={open} onClose={onClose} title={`Agregar a ${titulo}`}>
      {elegido ? (
        <Cantidad
          food={elegido}
          onVolver={() => setElegido(null)}
          onSave={(d) => {
            onSave(d)
            setElegido(null)
          }}
        />
      ) : manual ? (
        <Personalizado
          onVolver={() => setManual(false)}
          onSave={(d) => {
            onSave(d)
            setManual(false)
          }}
        />
      ) : (
        <div className="stack">
          <input
            className="input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca: pollo, arroz, banano…"
            autoFocus
          />

          <div className="nut-lista no-scrollbar">
            {resultados.map((f) => (
              <button key={f.id} className="nut-food" onClick={() => setElegido(f)}>
                <span className="nut-food__ic">{f.emoji}</span>
                <span className="grow">
                  <b>{f.name}</b>
                  <span className="nut-food__sub">
                    {f.kcal} kcal · P {f.protein} · C {f.carbs} · G {f.fat} (por 100 g)
                  </span>
                </span>
                <span className="nut-food__go">›</span>
              </button>
            ))}
            {resultados.length === 0 && (
              <p className="screen-sub" style={{ textAlign: 'center', padding: '14px 0' }}>
                No encontré ese alimento 🙈 Puedes agregarlo tú misma.
              </p>
            )}
          </div>

          <button className="btn btn--block" onClick={() => setManual(true)}>
            ✏️ Escribir otro alimento
          </button>
        </div>
      )}
    </Sheet>
  )
}

function Cantidad({
  food,
  onVolver,
  onSave,
}: {
  food: Food
  onVolver: () => void
  onSave: (data: DatosComida) => void
}) {
  const inicial = food.portions?.[0]?.grams ?? 100
  const [gramos, setGramos] = useState(String(inicial))
  const g = Math.max(0, Number(gramos.replace(',', '.')) || 0)
  const m = macrosFor(food, g)

  return (
    <div className="stack">
      <button className="nut-volver" onClick={onVolver}>
        ‹ Buscar otro
      </button>

      <div className="nut-elegido">
        <span className="nut-elegido__ic">{food.emoji}</span>
        <b>{food.name}</b>
      </div>

      {food.portions && food.portions.length > 0 && (
        <div className="nut-porciones no-scrollbar">
          {food.portions.map((p) => (
            <button
              key={p.label}
              className={`chip ${g === p.grams ? 'chip--active' : ''}`}
              onClick={() => setGramos(String(p.grams))}
            >
              {p.label}
            </button>
          ))}
          <button className={`chip ${g === 100 ? 'chip--active' : ''}`} onClick={() => setGramos('100')}>
            100 g
          </button>
        </div>
      )}

      <div className="field">
        <label>¿Cuántos gramos?</label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          value={gramos}
          onChange={(e) => setGramos(e.target.value)}
        />
      </div>

      <div className="nut-preview">
        <div className="nut-preview__kcal">
          <b>{m.kcal}</b>
          <span>kcal</span>
        </div>
        <div className="nut-preview__macros">
          <span>Proteína <b>{m.protein} g</b></span>
          <span>Carbos <b>{m.carbs} g</b></span>
          <span>Grasas <b>{m.fat} g</b></span>
        </div>
      </div>

      <button
        className="btn btn--primary btn--block"
        disabled={g <= 0}
        onClick={() =>
          onSave({
            name: food.name,
            grams: Math.round(g),
            kcal: m.kcal,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            foodId: food.id,
          })
        }
      >
        Agregar
      </button>
    </div>
  )
}

function Personalizado({
  onVolver,
  onSave,
}: {
  onVolver: () => void
  onSave: (data: DatosComida) => void
}) {
  const [name, setName] = useState('')
  const [gramos, setGramos] = useState('')
  const [kcal, setKcal] = useState('')
  const [prot, setProt] = useState('')
  const [carb, setCarb] = useState('')
  const [grasa, setGrasa] = useState('')

  const n = (v: string) => Math.max(0, Math.round(Number(v.replace(',', '.')) || 0))

  return (
    <div className="stack">
      <button className="nut-volver" onClick={onVolver}>
        ‹ Buscar en la lista
      </button>

      <p className="screen-sub" style={{ paddingLeft: 2 }}>
        Escribe lo que dice la etiqueta, para lo que te comiste 💗
      </p>

      <div className="field">
        <label>¿Qué comiste?</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: barra de proteína"
          maxLength={40}
        />
      </div>

      <div className="nut-grid2">
        <div className="field">
          <label>Gramos</label>
          <input className="input" type="number" inputMode="numeric" value={gramos} onChange={(e) => setGramos(e.target.value)} placeholder="60" />
        </div>
        <div className="field">
          <label>Calorías</label>
          <input className="input" type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="220" />
        </div>
      </div>

      <div className="nut-grid3">
        <div className="field">
          <label>Proteína (g)</label>
          <input className="input" type="number" inputMode="numeric" value={prot} onChange={(e) => setProt(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Carbos (g)</label>
          <input className="input" type="number" inputMode="numeric" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Grasas (g)</label>
          <input className="input" type="number" inputMode="numeric" value={grasa} onChange={(e) => setGrasa(e.target.value)} placeholder="0" />
        </div>
      </div>

      <button
        className="btn btn--primary btn--block"
        disabled={!name.trim() || n(kcal) <= 0}
        onClick={() =>
          onSave({
            name: name.trim(),
            grams: n(gramos),
            kcal: n(kcal),
            protein: n(prot),
            carbs: n(carb),
            fat: n(grasa),
          })
        }
      >
        Agregar
      </button>
    </div>
  )
}

/* ===========================================================
   Editar / borrar un alimento ya registrado
   =========================================================== */

function EditarComida({
  open,
  log,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  log?: FoodLog
  onClose: () => void
  onSave: (log: FoodLog) => void
  onDelete: () => void
}) {
  const [gramos, setGramos] = useState(log ? String(log.grams) : '')
  const [slot, setSlot] = useState<MealSlot>(log?.slot ?? 'desayuno')

  const firma = `${open}|${log?.id ?? ''}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setGramos(log ? String(log.grams) : '')
    setSlot(log?.slot ?? 'desayuno')
  }

  if (!log) return <Sheet open={false} onClose={onClose}><div /></Sheet>

  const food = log.foodId ? FOODS.find((f) => f.id === log.foodId) : undefined
  const g = Math.max(0, Number(gramos.replace(',', '.')) || 0)
  // si vino de la tabla, recalculamos; si fue manual, se escala proporcional
  const m = food
    ? macrosFor(food, g)
    : {
        kcal: Math.round((log.kcal / Math.max(1, log.grams)) * g),
        protein: Math.round((log.protein / Math.max(1, log.grams)) * g),
        carbs: Math.round((log.carbs / Math.max(1, log.grams)) * g),
        fat: Math.round((log.fat / Math.max(1, log.grams)) * g),
      }
  const puedeEscalar = !!food || log.grams > 0

  return (
    <Sheet open={open} onClose={onClose} title={log.name}>
      <div className="stack">
        <div className="nut-porciones no-scrollbar">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s.key}
              className={`chip ${slot === s.key ? 'chip--active' : ''}`}
              onClick={() => setSlot(s.key)}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Gramos</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={gramos}
            onChange={(e) => setGramos(e.target.value)}
            disabled={!puedeEscalar}
          />
        </div>

        <div className="nut-preview">
          <div className="nut-preview__kcal">
            <b>{puedeEscalar ? m.kcal : log.kcal}</b>
            <span>kcal</span>
          </div>
          <div className="nut-preview__macros">
            <span>Proteína <b>{puedeEscalar ? m.protein : log.protein} g</b></span>
            <span>Carbos <b>{puedeEscalar ? m.carbs : log.carbs} g</b></span>
            <span>Grasas <b>{puedeEscalar ? m.fat : log.fat} g</b></span>
          </div>
        </div>

        <button
          className="btn btn--primary btn--block"
          onClick={() =>
            onSave(
              puedeEscalar
                ? { ...log, slot, grams: Math.round(g), ...m }
                : { ...log, slot },
            )
          }
        >
          Guardar
        </button>

        <button className="btn btn--block btn--ghost nut-del" onClick={onDelete}>
          Quitar de mi día
        </button>
      </div>
    </Sheet>
  )
}

function MetasForm({
  kcal,
  prot,
  onSave,
}: {
  kcal: number
  prot: number
  onSave: (kcal: number, prot: number) => void
}) {
  const [k, setK] = useState(String(kcal))
  const [p, setP] = useState(String(prot))

  return (
    <div className="stack">
      <p className="screen-sub" style={{ paddingLeft: 2 }}>
        Ponle la meta que te sirva. Si no sabes cuál, déjala así y la ajustas después 💗
      </p>
      <div className="nut-grid2">
        <div className="field">
          <label>Calorías al día</label>
          <input className="input" type="number" inputMode="numeric" value={k} onChange={(e) => setK(e.target.value)} />
        </div>
        <div className="field">
          <label>Proteína (g)</label>
          <input className="input" type="number" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
        </div>
      </div>
      <button
        className="btn btn--primary btn--block"
        onClick={() => onSave(Math.max(0, Number(k) || 0), Math.max(0, Number(p) || 0))}
      >
        Guardar metas
      </button>
    </div>
  )
}
