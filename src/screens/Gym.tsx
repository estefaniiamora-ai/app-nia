import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from '../components/ui/Sheet'
import Cat from '../components/Cat/Cat'
import { uid } from '../lib/id'
import { localDayKey, daysBetween } from '../lib/date'
import type { Workout, WorkoutExercise, WorkoutSet } from '../data/types'
import './Gym.css'

/** Rutinas rápidas para no escribir el nombre a mano. */
const RUTINAS: { emoji: string; name: string }[] = [
  { emoji: '🦵', name: 'Pierna' },
  { emoji: '🍑', name: 'Glúteo' },
  { emoji: '💪', name: 'Brazos' },
  { emoji: '🎽', name: 'Espalda' },
  { emoji: '🫁', name: 'Pecho' },
  { emoji: '🏃‍♀️', name: 'Cardio' },
  { emoji: '🧘‍♀️', name: 'Full body' },
  { emoji: '🤸‍♀️', name: 'Abdomen' },
]

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** 'YYYY-MM-DD' → "12 de marzo" (o "Hoy" / "Ayer"). */
function labelDia(key: string): string {
  const hoy = localDayKey()
  const diff = daysBetween(key, hoy)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  const [y, m, d] = key.split('-').map(Number)
  const mismoAno = y === new Date().getFullYear()
  return `${d} de ${MESES[m - 1]}${mismoAno ? '' : ' de ' + y}`
}

/** Kilos (número bonito) a partir de gramos. */
function kg(gramos: number): string {
  const k = gramos / 1000
  return Number.isInteger(k) ? String(k) : k.toFixed(1)
}

/** Total levantado en un entreno: repeticiones × peso, en kg. */
function volumenKg(w: Workout): number {
  let g = 0
  for (const e of w.exercises) {
    for (const s of e.sets) g += (s.weightG ?? 0) * (s.reps || 0)
  }
  return Math.round(g / 1000)
}

function totalSeries(w: Workout): number {
  return w.exercises.reduce((n, e) => n + e.sets.length, 0)
}

function normalizar(t: string): string {
  return t.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function Gym() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useApp()
  const navigate = useNavigate()
  const [editando, setEditando] = useState<Workout | null>(null)
  const [creando, setCreando] = useState(false)

  const ordenados = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [workouts],
  )

  /* ----- resumen: esta semana, este mes y racha de días ----- */
  const resumen = useMemo(() => {
    const hoy = localDayKey()
    const dias = new Set(workouts.map((w) => w.date))
    const semana = workouts.filter((w) => daysBetween(w.date, hoy) < 7 && daysBetween(w.date, hoy) >= 0).length
    const mes = workouts.filter((w) => w.date.slice(0, 7) === hoy.slice(0, 7)).length
    // racha: días seguidos (hacia atrás) con entreno; se permite empezar ayer
    let racha = 0
    const inicio = dias.has(hoy) ? 0 : 1
    for (let i = inicio; i < 400; i++) {
      const d = new Date(hoy + 'T00:00:00')
      d.setDate(d.getDate() - i)
      if (dias.has(localDayKey(d.getTime()))) racha++
      else break
    }
    const kgMes = workouts
      .filter((w) => w.date.slice(0, 7) === hoy.slice(0, 7))
      .reduce((n, w) => n + volumenKg(w), 0)
    return { semana, mes, racha, kgMes }
  }, [workouts])

  /* ----- último peso corporal registrado ----- */
  const peso = useMemo(() => {
    const conPeso = ordenados.filter((w) => w.bodyWeightG && w.bodyWeightG > 0)
    if (!conPeso.length) return null
    const ultimo = conPeso[0]
    const anterior = conPeso[1]
    const dif = anterior ? (ultimo.bodyWeightG! - anterior.bodyWeightG!) / 1000 : null
    return { actual: kg(ultimo.bodyWeightG!), dif: dif === null ? null : Math.round(dif * 10) / 10 }
  }, [ordenados])

  return (
    <main className="screen gym">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Mi Gym 💪</h1>
          <p className="screen-sub">Tu progreso, entreno a entreno</p>
        </div>
        <button className="iconbtn" onClick={() => setCreando(true)} aria-label="Nuevo entreno">
          ＋
        </button>
      </div>

      {/* ----- Resumen ----- */}
      <div className="gym-stats">
        <div className="gym-stat">
          <b>{resumen.semana}</b>
          <span>esta semana</span>
        </div>
        <div className="gym-stat">
          <b>{resumen.mes}</b>
          <span>este mes</span>
        </div>
        <div className="gym-stat">
          <b>🔥 {resumen.racha}</b>
          <span>días seguidos</span>
        </div>
      </div>

      {resumen.kgMes > 0 && (
        <p className="gym-vol">
          Este mes has levantado <b>{resumen.kgMes.toLocaleString('es-CO')} kg</b> en total 🏋️‍♀️
        </p>
      )}

      {peso && (
        <div className="gym-peso">
          <span className="gym-peso__ic">⚖️</span>
          <span className="grow">
            <b>Tu peso: {peso.actual} kg</b>
            <span className="gym-peso__sub">
              {peso.dif === null
                ? 'tu primer registro 💗'
                : peso.dif === 0
                  ? 'igual que la vez pasada'
                  : peso.dif > 0
                    ? `+${peso.dif} kg desde el entreno anterior`
                    : `${peso.dif} kg desde el entreno anterior`}
            </span>
          </span>
        </div>
      )}

      {/* ----- Lista de entrenos ----- */}
      {ordenados.length === 0 ? (
        <div className="gym-empty">
          <Cat size={130} mood="happy" alive={false} speech="¡vamos! 💪" />
          <h3>Aún no has registrado entrenos</h3>
          <p className="screen-sub">
            Anota qué hiciste, cuántas series y con cuánto peso. Así ves tu progreso 💗
          </p>
          <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreando(true)}>
            Registrar mi primer entreno
          </button>
        </div>
      ) : (
        <div className="list">
          {ordenados.map((w) => (
            <button key={w.id} className="row" onClick={() => setEditando(w)} style={{ width: '100%', textAlign: 'left' }}>
              <span className="row__icon">{w.emoji || '💪'}</span>
              <span className="row__main">
                <span className="row__title">{w.name}</span>
                <span className="row__sub">
                  {labelDia(w.date)} · {totalSeries(w)} series
                  {w.durationMin ? ` · ${w.durationMin} min` : ''}
                </span>
              </span>
              <span className="row__right gym-row__kg">
                {volumenKg(w) > 0 ? `${volumenKg(w).toLocaleString('es-CO')} kg` : '›'}
              </span>
            </button>
          ))}
        </div>
      )}

      <EditorEntreno
        open={creando}
        historial={workouts}
        onClose={() => setCreando(false)}
        onSave={(data) => {
          addWorkout(data)
          setCreando(false)
        }}
      />

      <EditorEntreno
        open={!!editando}
        workout={editando ?? undefined}
        historial={workouts}
        onClose={() => setEditando(null)}
        onSave={(data) => {
          if (editando) updateWorkout({ ...editando, ...data })
          setEditando(null)
        }}
        onDelete={() => {
          if (editando) deleteWorkout(editando.id)
          setEditando(null)
        }}
      />
    </main>
  )
}

/* ===========================================================
   Editor de un entreno
   =========================================================== */

type DatosEntreno = Omit<Workout, 'id' | 'createdAt'>

function EditorEntreno({
  open,
  workout,
  historial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  workout?: Workout
  historial: Workout[]
  onClose: () => void
  onSave: (data: DatosEntreno) => void
  onDelete?: () => void
}) {
  const [date, setDate] = useState(workout?.date ?? localDayKey())
  const [name, setName] = useState(workout?.name ?? '')
  const [emoji, setEmoji] = useState(workout?.emoji ?? '💪')
  const [duracion, setDuracion] = useState(workout?.durationMin ? String(workout.durationMin) : '')
  const [pesoCuerpo, setPesoCuerpo] = useState(workout?.bodyWeightG ? kg(workout.bodyWeightG) : '')
  const [note, setNote] = useState(workout?.note ?? '')
  const [ejercicios, setEjercicios] = useState<WorkoutExercise[]>(workout?.exercises ?? [])
  const [key, setKey] = useState(0)

  // al abrir, recargar el formulario con los datos de ese entreno
  const firma = `${open}|${workout?.id ?? 'nuevo'}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setDate(workout?.date ?? localDayKey())
    setName(workout?.name ?? '')
    setEmoji(workout?.emoji ?? '💪')
    setDuracion(workout?.durationMin ? String(workout.durationMin) : '')
    setPesoCuerpo(workout?.bodyWeightG ? kg(workout.bodyWeightG) : '')
    setNote(workout?.note ?? '')
    setEjercicios(workout?.exercises ?? [])
    setKey((k) => k + 1)
  }

  /** El entreno anterior (para repetir la rutina tal cual). */
  const anterior = useMemo(() => {
    const previos = historial
      .filter((w) => w.id !== workout?.id && w.exercises.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    return previos[0] ?? null
  }, [historial, workout?.id])

  /** La última vez que hizo ESE ejercicio (para ver si va subiendo). */
  function ultimaVez(nombre: string): string | null {
    const n = normalizar(nombre)
    if (!n) return null
    const previos = historial
      .filter((w) => w.id !== workout?.id && w.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    for (const w of previos) {
      const ej = w.exercises.find((e) => normalizar(e.name) === n)
      if (ej && ej.sets.length) {
        const mejor = [...ej.sets].sort((a, b) => (b.weightG ?? 0) - (a.weightG ?? 0))[0]
        const pesoTxt = mejor.weightG ? `${kg(mejor.weightG)} kg` : 'sin peso'
        return `la vez pasada: ${mejor.reps} reps × ${pesoTxt}`
      }
    }
    return null
  }

  function agregarEjercicio() {
    setEjercicios((es) => [...es, { id: uid('ex'), name: '', sets: [{ reps: 10 }] }])
  }
  function cambiarEjercicio(id: string, patch: Partial<WorkoutExercise>) {
    setEjercicios((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }
  function quitarEjercicio(id: string) {
    setEjercicios((es) => es.filter((e) => e.id !== id))
  }
  function agregarSerie(id: string) {
    setEjercicios((es) =>
      es.map((e) => {
        if (e.id !== id) return e
        const ultima = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { reps: ultima?.reps ?? 10, weightG: ultima?.weightG }] }
      }),
    )
  }
  function cambiarSerie(id: string, i: number, patch: Partial<WorkoutSet>) {
    setEjercicios((es) =>
      es.map((e) =>
        e.id === id ? { ...e, sets: e.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : e,
      ),
    )
  }
  function quitarSerie(id: string, i: number) {
    setEjercicios((es) => es.map((e) => (e.id === id ? { ...e, sets: e.sets.filter((_, j) => j !== i) } : e)))
  }

  function repetirAnterior() {
    if (!anterior) return
    if (!name) setName(anterior.name)
    setEmoji(anterior.emoji || '💪')
    setEjercicios(
      anterior.exercises.map((e) => ({
        id: uid('ex'),
        name: e.name,
        sets: e.sets.map((s) => ({ ...s })),
      })),
    )
  }

  function guardar() {
    const limpios = ejercicios
      .map((e) => ({ ...e, name: e.name.trim(), sets: e.sets.filter((s) => s.reps > 0) }))
      .filter((e) => e.name && e.sets.length)
    const pesoG = Math.round(Number(pesoCuerpo.replace(',', '.')) * 1000)
    onSave({
      date,
      name: name.trim() || 'Entreno',
      emoji: emoji || '💪',
      durationMin: duracion ? Number(duracion) : undefined,
      bodyWeightG: pesoG > 0 ? pesoG : undefined,
      note: note.trim() || undefined,
      exercises: limpios,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title={workout ? 'Editar entreno' : 'Nuevo entreno'}>
      <div className="stack" key={key}>
        {/* rutinas rápidas */}
        <div className="gym-rutinas no-scrollbar">
          {RUTINAS.map((r) => (
            <button
              key={r.name}
              className={`chip ${name === r.name ? 'chip--active' : ''}`}
              onClick={() => {
                setName(r.name)
                setEmoji(r.emoji)
              }}
            >
              {r.emoji} {r.name}
            </button>
          ))}
        </div>

        <div className="field">
          <label>¿Qué entrenaste?</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pierna, glúteo, cardio…"
            maxLength={40}
          />
        </div>

        <div className="gym-grid3">
          <div className="field">
            <label>Día</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Minutos</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="60"
            />
          </div>
          <div className="field">
            <label>Tu peso (kg)</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={pesoCuerpo}
              onChange={(e) => setPesoCuerpo(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>

        {/* ejercicios */}
        <div className="spread">
          <span className="t-label">Ejercicios</span>
          {anterior && (
            <button className="btn btn--sm btn--ghost" onClick={repetirAnterior}>
              ↻ Repetir el anterior
            </button>
          )}
        </div>

        {ejercicios.length === 0 && (
          <p className="screen-sub" style={{ textAlign: 'center', padding: '4px 0 2px' }}>
            Agrega los ejercicios que hiciste 💪
          </p>
        )}

        {ejercicios.map((e) => {
          const pista = ultimaVez(e.name)
          return (
            <div key={e.id} className="gym-ex">
              <div className="gym-ex__head">
                <input
                  className="input gym-ex__name"
                  value={e.name}
                  onChange={(ev) => cambiarEjercicio(e.id, { name: ev.target.value })}
                  placeholder="Sentadilla, prensa, curl…"
                  maxLength={40}
                />
                <button className="gym-ex__del" onClick={() => quitarEjercicio(e.id)} aria-label="Quitar ejercicio">
                  ✕
                </button>
              </div>

              {pista && <p className="gym-ex__hint">📈 {pista}</p>}

              <div className="gym-sets">
                {e.sets.map((s, i) => (
                  <div key={i} className="gym-set">
                    <span className="gym-set__n">{i + 1}</span>
                    <input
                      className="input gym-set__in"
                      type="number"
                      inputMode="numeric"
                      value={s.reps || ''}
                      onChange={(ev) => cambiarSerie(e.id, i, { reps: Number(ev.target.value) })}
                      placeholder="reps"
                    />
                    <span className="gym-set__x">×</span>
                    <input
                      className="input gym-set__in"
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={s.weightG ? kg(s.weightG) : ''}
                      onChange={(ev) => {
                        const v = Number(ev.target.value.replace(',', '.'))
                        cambiarSerie(e.id, i, { weightG: v > 0 ? Math.round(v * 1000) : undefined })
                      }}
                      placeholder="kg"
                    />
                    <button className="gym-set__del" onClick={() => quitarSerie(e.id, i)} aria-label="Quitar serie">
                      −
                    </button>
                  </div>
                ))}
              </div>

              <button className="btn btn--sm btn--ghost gym-ex__add" onClick={() => agregarSerie(e.id)}>
                ＋ Otra serie
              </button>
            </div>
          )
        })}

        <button className="btn btn--block" onClick={agregarEjercicio}>
          ＋ Agregar ejercicio
        </button>

        <div className="field">
          <label>Notita (opcional)</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cómo te sentiste, qué mejorar…"
            maxLength={200}
          />
        </div>

        <button className="btn btn--primary btn--block" onClick={guardar}>
          Guardar entreno
        </button>

        {onDelete && (
          <button className="btn btn--block btn--ghost gym-del" onClick={onDelete}>
            Eliminar este entreno
          </button>
        )}
      </div>
    </Sheet>
  )
}
