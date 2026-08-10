import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from '../components/ui/Sheet'
import Cat from '../components/Cat/Cat'
import { uid } from '../lib/id'
import { localDayKey, daysBetween } from '../lib/date'
import type { EnglishLesson, EnglishTask, VocabWord } from '../data/types'
import './Ingles.css'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function labelDia(key: string): string {
  const hoy = localDayKey()
  const diff = daysBetween(key, hoy)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  const [y, m, d] = key.split('-').map(Number)
  const mismoAno = y === new Date().getFullYear()
  return `${d} de ${MESES[m - 1]}${mismoAno ? '' : ' de ' + y}`
}

/** Cómo se ve la fecha de entrega de una tarea. */
function labelEntrega(due: string): { texto: string; tono: 'hoy' | 'tarde' | 'normal' } {
  const faltan = daysBetween(localDayKey(), due)
  if (faltan < 0) return { texto: `atrasada (${labelDia(due).toLowerCase()})`, tono: 'tarde' }
  if (faltan === 0) return { texto: '¡es para hoy!', tono: 'hoy' }
  if (faltan === 1) return { texto: 'para mañana', tono: 'hoy' }
  if (faltan <= 7) return { texto: `en ${faltan} días`, tono: 'normal' }
  return { texto: `para el ${labelDia(due).toLowerCase()}`, tono: 'normal' }
}

/** Frasecitas de ánimo según cómo va. */
function animo(clases: number, palabras: number, pendientes: number, racha: number): string {
  const fuego = racha >= 2 ? ` 🔥 ${racha} días seguidos` : ''
  if (clases === 0) return '¡Empecemos! Anota tu primera clase 💗'
  if (pendientes > 0)
    return `Te quedan ${pendientes} ${pendientes === 1 ? 'tarea' : 'tareas'}. ¡Tú puedes! 💪${fuego}`
  if (palabras >= 50) return `¡${palabras} palabras nuevas! Vas volando 🚀${fuego}`
  if (palabras > 0) return `¡${palabras} palabras nuevas y sin tareas pendientes! 🎉${fuego}`
  return `¡Vas juiciosa! Sigue así 💗${fuego}`
}

type Pestana = 'clases' | 'tareas' | 'palabras'

export default function Ingles() {
  const {
    lessons,
    englishTasks,
    addLesson,
    updateLesson,
    deleteLesson,
    addEnglishTask,
    updateEnglishTask,
    deleteEnglishTask,
  } = useApp()
  const navigate = useNavigate()
  const [pestana, setPestana] = useState<Pestana>('clases')
  const [editandoClase, setEditandoClase] = useState<EnglishLesson | null>(null)
  const [creandoClase, setCreandoClase] = useState(false)
  const [editandoTarea, setEditandoTarea] = useState<EnglishTask | null>(null)
  const [creandoTarea, setCreandoTarea] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [practicando, setPracticando] = useState(false)

  const clases = useMemo(
    () => [...lessons].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [lessons],
  )

  const pendientes = useMemo(
    () =>
      englishTasks
        .filter((t) => !t.done)
        .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.createdAt - b.createdAt),
    [englishTasks],
  )
  const hechas = useMemo(
    () => englishTasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    [englishTasks],
  )

  const palabras = useMemo(() => {
    const todas = clases.flatMap((l) => l.words.map((w) => ({ ...w, fecha: l.date, clase: l.title })))
    const q = busqueda
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
    if (!q) return todas
    return todas.filter((w) =>
      `${w.en} ${w.es}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .includes(q),
    )
  }, [clases, busqueda])

  /* ----- resumencito de arriba ----- */
  const resumen = useMemo(() => {
    const hoy = localDayKey()
    const totalPalabras = lessons.reduce((n, l) => n + l.words.length, 0)
    // racha: días seguidos con al menos una clase anotada
    const dias = new Set(lessons.map((l) => l.date))
    let racha = 0
    const inicio = dias.has(hoy) ? 0 : 1
    for (let i = inicio; i < 400; i++) {
      const d = new Date(hoy + 'T00:00:00')
      d.setDate(d.getDate() - i)
      if (dias.has(localDayKey(d.getTime()))) racha++
      else break
    }
    return { totalPalabras, racha }
  }, [lessons])

  function nuevoDeLaPestana() {
    if (pestana === 'tareas') setCreandoTarea(true)
    else setCreandoClase(true)
  }

  return (
    <main className="screen eng">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Mi Inglés 📚</h1>
          <p className="screen-sub">Tus clases, tareas y palabras nuevas</p>
        </div>
        <button className="iconbtn" onClick={nuevoDeLaPestana} aria-label="Agregar">
          ＋
        </button>
      </div>

      {/* ----- Resumen ----- */}
      <div className="eng-stats">
        <div className="eng-stat">
          <b>{lessons.length}</b>
          <span>clases</span>
        </div>
        <div className="eng-stat">
          <b>{resumen.totalPalabras}</b>
          <span>palabras</span>
        </div>
        <div className="eng-stat">
          <b>{pendientes.length}</b>
          <span>por hacer</span>
        </div>
      </div>

      <p className="eng-animo">
        {animo(lessons.length, resumen.totalPalabras, pendientes.length, resumen.racha)}
      </p>

      {/* ----- Pestañas ----- */}
      <div className="eng-tabs">
        <button
          className={`chip ${pestana === 'clases' ? 'chip--active' : ''}`}
          onClick={() => setPestana('clases')}
        >
          📖 Clases
        </button>
        <button
          className={`chip ${pestana === 'tareas' ? 'chip--active' : ''}`}
          onClick={() => setPestana('tareas')}
        >
          ✏️ Tareas {pendientes.length > 0 ? `(${pendientes.length})` : ''}
        </button>
        <button
          className={`chip ${pestana === 'palabras' ? 'chip--active' : ''}`}
          onClick={() => setPestana('palabras')}
        >
          🔤 Palabras
        </button>
      </div>

      {/* ================= CLASES ================= */}
      {pestana === 'clases' &&
        (clases.length === 0 ? (
          <div className="eng-empty">
            <Cat size={130} mood="happy" alive={false} speech="let's go! 📚" />
            <h3>Aún no has anotado clases</h3>
            <p className="screen-sub">
              Después de cada clase, anota el tema, qué aprendiste y las palabras nuevas 💗
            </p>
            <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreandoClase(true)}>
              Anotar mi primera clase
            </button>
          </div>
        ) : (
          <div className="list">
            {clases.map((l) => {
              const tareasDeLaClase = englishTasks.filter((t) => t.lessonId === l.id)
              const sinHacer = tareasDeLaClase.filter((t) => !t.done).length
              return (
                <button
                  key={l.id}
                  className="row"
                  onClick={() => setEditandoClase(l)}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <span className="row__icon">{l.emoji || '📖'}</span>
                  <span className="row__main">
                    <span className="row__title">{l.title}</span>
                    <span className="row__sub">
                      {labelDia(l.date)}
                      {l.words.length > 0
                        ? ` · ${l.words.length} ${l.words.length === 1 ? 'palabra' : 'palabras'}`
                        : ''}
                      {sinHacer > 0 ? ` · ${sinHacer} por hacer` : ''}
                    </span>
                  </span>
                  <span className="row__right eng-row__go">›</span>
                </button>
              )
            })}
          </div>
        ))}

      {/* ================= TAREAS ================= */}
      {pestana === 'tareas' && (
        <>
          {pendientes.length === 0 && hechas.length === 0 ? (
            <div className="eng-empty">
              <Cat size={120} mood="happy" alive={false} speech="¿qué toca? ✏️" />
              <h3>No tienes tareas anotadas</h3>
              <p className="screen-sub">Anótalas apenas te las dejen, así no se te olvida ninguna 💗</p>
              <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreandoTarea(true)}>
                Anotar una tarea
              </button>
            </div>
          ) : (
            <>
              {pendientes.length === 0 ? (
                <p className="eng-listo">🎉 ¡No tienes nada pendiente! Disfruta 💗</p>
              ) : (
                <div className="list">
                  {pendientes.map((t) => (
                    <FilaTarea
                      key={t.id}
                      tarea={t}
                      clase={lessons.find((l) => l.id === t.lessonId)}
                      onToggle={() => updateEnglishTask({ ...t, done: true, doneAt: Date.now() })}
                      onAbrir={() => setEditandoTarea(t)}
                    />
                  ))}
                </div>
              )}

              {hechas.length > 0 && (
                <>
                  <span className="t-label" style={{ marginTop: 6 }}>
                    Ya hechas ✅
                  </span>
                  <div className="list">
                    {hechas.slice(0, 20).map((t) => (
                      <FilaTarea
                        key={t.id}
                        tarea={t}
                        clase={lessons.find((l) => l.id === t.lessonId)}
                        onToggle={() => updateEnglishTask({ ...t, done: false, doneAt: undefined })}
                        onAbrir={() => setEditandoTarea(t)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ================= PALABRAS ================= */}
      {pestana === 'palabras' &&
        (resumen.totalPalabras === 0 ? (
          <div className="eng-empty">
            <Cat size={120} mood="happy" alive={false} speech="new words! 🔤" />
            <h3>Todavía no hay palabras</h3>
            <p className="screen-sub">
              Las palabras nuevas se guardan dentro de cada clase, y aquí te las junto todas 💗
            </p>
          </div>
        ) : (
          <>
            <input
              className="input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca una palabra…"
            />

            <button className="btn btn--primary btn--block" onClick={() => setPracticando(true)}>
              🎲 Practicar palabras
            </button>

            <div className="eng-words">
              {palabras.map((w) => (
                <div key={w.id} className="eng-word">
                  <div className="eng-word__top">
                    <b>{w.en}</b>
                    <span className="eng-word__es">{w.es}</span>
                  </div>
                  {w.example && <p className="eng-word__ej">“{w.example}”</p>}
                  <span className="eng-word__clase">{labelDia(w.fecha)} · {w.clase}</span>
                </div>
              ))}
              {palabras.length === 0 && (
                <p className="screen-sub" style={{ textAlign: 'center', padding: '10px 0' }}>
                  No encontré esa palabra 🙈
                </p>
              )}
            </div>
          </>
        ))}

      {/* ----- Hojas ----- */}
      <EditorClase
        open={creandoClase}
        onClose={() => setCreandoClase(false)}
        onSave={(datos, tareas) => {
          const clase = addLesson(datos)
          tareas.forEach((t) =>
            addEnglishTask({ text: t.text, due: t.due, done: false, lessonId: clase.id }),
          )
          setCreandoClase(false)
        }}
      />

      <EditorClase
        open={!!editandoClase}
        lesson={editandoClase ?? undefined}
        tareasExistentes={englishTasks.filter((t) => t.lessonId === editandoClase?.id)}
        onClose={() => setEditandoClase(null)}
        onSave={(datos, tareas, borradas) => {
          if (!editandoClase) return
          updateLesson({ ...editandoClase, ...datos })
          borradas.forEach((id) => deleteEnglishTask(id))
          tareas.forEach((t) =>
            t.id
              ? updateEnglishTask({ ...(englishTasks.find((x) => x.id === t.id) as EnglishTask), text: t.text, due: t.due })
              : addEnglishTask({ text: t.text, due: t.due, done: false, lessonId: editandoClase.id }),
          )
          setEditandoClase(null)
        }}
        onDelete={() => {
          if (editandoClase) deleteLesson(editandoClase.id)
          setEditandoClase(null)
        }}
      />

      <EditorTarea
        open={creandoTarea}
        clases={clases}
        onClose={() => setCreandoTarea(false)}
        onSave={(datos) => {
          addEnglishTask({ ...datos, done: false })
          setCreandoTarea(false)
        }}
      />

      <EditorTarea
        open={!!editandoTarea}
        tarea={editandoTarea ?? undefined}
        clases={clases}
        onClose={() => setEditandoTarea(null)}
        onSave={(datos) => {
          if (editandoTarea) updateEnglishTask({ ...editandoTarea, ...datos })
          setEditandoTarea(null)
        }}
        onDelete={() => {
          if (editandoTarea) deleteEnglishTask(editandoTarea.id)
          setEditandoTarea(null)
        }}
      />

      <Sheet open={practicando} onClose={() => setPracticando(false)} title="Practiquemos 🎲">
        <Practica palabras={palabras} />
      </Sheet>
    </main>
  )
}

/* ===========================================================
   Fila de una tarea
   =========================================================== */

function FilaTarea({
  tarea,
  clase,
  onToggle,
  onAbrir,
}: {
  tarea: EnglishTask
  clase?: EnglishLesson
  onToggle: () => void
  onAbrir: () => void
}) {
  const entrega = tarea.due && !tarea.done ? labelEntrega(tarea.due) : null
  return (
    <div className={`row eng-task ${tarea.done ? 'eng-task--done' : ''}`}>
      <button className="eng-task__check" onClick={onToggle} aria-label={tarea.done ? 'Marcar sin hacer' : 'Marcar hecha'}>
        {tarea.done ? '✅' : '⬜'}
      </button>
      <button className="row__main eng-task__body" onClick={onAbrir} style={{ textAlign: 'left' }}>
        <span className="row__title">{tarea.text}</span>
        <span className="row__sub">
          {entrega && <span className={`eng-task__due eng-task__due--${entrega.tono}`}>{entrega.texto}</span>}
          {entrega && clase ? ' · ' : ''}
          {clase ? clase.title : !entrega ? 'sin fecha' : ''}
        </span>
      </button>
    </div>
  )
}

/* ===========================================================
   Editor de una clase
   =========================================================== */

type DatosClase = Omit<EnglishLesson, 'id' | 'createdAt'>
/** tarea en edición: si trae id, ya existía */
interface TareaEnEdicion {
  id?: string
  text: string
  due?: string
}

const TEMAS: { emoji: string; name: string }[] = [
  { emoji: '🗣️', name: 'Speaking' },
  { emoji: '👂', name: 'Listening' },
  { emoji: '📖', name: 'Reading' },
  { emoji: '✍️', name: 'Writing' },
  { emoji: '📐', name: 'Grammar' },
  { emoji: '🔤', name: 'Vocabulary' },
]

function EditorClase({
  open,
  lesson,
  tareasExistentes = [],
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  lesson?: EnglishLesson
  tareasExistentes?: EnglishTask[]
  onClose: () => void
  onSave: (datos: DatosClase, tareas: TareaEnEdicion[], borradas: string[]) => void
  onDelete?: () => void
}) {
  const [date, setDate] = useState(lesson?.date ?? localDayKey())
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [emoji, setEmoji] = useState(lesson?.emoji ?? '📖')
  const [learned, setLearned] = useState(lesson?.learned ?? '')
  const [words, setWords] = useState<VocabWord[]>(lesson?.words ?? [])
  const [tareas, setTareas] = useState<TareaEnEdicion[]>(
    tareasExistentes.map((t) => ({ id: t.id, text: t.text, due: t.due })),
  )
  const [borradas, setBorradas] = useState<string[]>([])

  const firma = `${open}|${lesson?.id ?? 'nueva'}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setDate(lesson?.date ?? localDayKey())
    setTitle(lesson?.title ?? '')
    setEmoji(lesson?.emoji ?? '📖')
    setLearned(lesson?.learned ?? '')
    setWords(lesson?.words ?? [])
    setTareas(tareasExistentes.map((t) => ({ id: t.id, text: t.text, due: t.due })))
    setBorradas([])
  }

  function guardar() {
    onSave(
      {
        date,
        title: title.trim() || 'Clase de inglés',
        emoji: emoji || '📖',
        learned: learned.trim() || undefined,
        words: words.filter((w) => w.en.trim() && w.es.trim()).map((w) => ({
          ...w,
          en: w.en.trim(),
          es: w.es.trim(),
          example: w.example?.trim() || undefined,
        })),
      },
      tareas.filter((t) => t.text.trim()).map((t) => ({ ...t, text: t.text.trim() })),
      borradas,
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title={lesson ? 'Editar clase' : 'Nueva clase'}>
      <div className="stack">
        <div className="eng-temas no-scrollbar">
          {TEMAS.map((t) => (
            <button
              key={t.name}
              className={`chip ${title === t.name ? 'chip--active' : ''}`}
              onClick={() => {
                setTitle(t.name)
                setEmoji(t.emoji)
              }}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>

        <div className="eng-grid2">
          <div className="field">
            <label>¿De qué fue la clase?</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Past simple, saludos…"
              maxLength={50}
            />
          </div>
          <div className="field">
            <label>Día</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>¿Qué aprendiste hoy?</label>
          <textarea
            className="textarea eng-learned"
            value={learned}
            onChange={(e) => setLearned(e.target.value)}
            placeholder="Lo que entendiste, lo que te costó, ejemplos…"
            maxLength={800}
          />
        </div>

        {/* ----- palabras nuevas ----- */}
        <span className="t-label">Palabras nuevas</span>
        {words.map((w, i) => (
          <div key={w.id} className="eng-wordedit">
            <div className="eng-wordedit__row">
              <input
                className="input"
                value={w.en}
                onChange={(e) =>
                  setWords((ws) => ws.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))
                }
                placeholder="en inglés"
                maxLength={40}
              />
              <span className="eng-wordedit__ar">→</span>
              <input
                className="input"
                value={w.es}
                onChange={(e) =>
                  setWords((ws) => ws.map((x, j) => (j === i ? { ...x, es: e.target.value } : x)))
                }
                placeholder="en español"
                maxLength={40}
              />
              <button
                className="eng-wordedit__del"
                onClick={() => setWords((ws) => ws.filter((_, j) => j !== i))}
                aria-label="Quitar palabra"
              >
                ✕
              </button>
            </div>
            <input
              className="input eng-wordedit__ej"
              value={w.example ?? ''}
              onChange={(e) =>
                setWords((ws) => ws.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)))
              }
              placeholder="Ejemplo (opcional)"
              maxLength={90}
            />
          </div>
        ))}
        <button
          className="btn btn--block"
          onClick={() => setWords((ws) => [...ws, { id: uid('w'), en: '', es: '' }])}
        >
          ＋ Agregar palabra
        </button>

        {/* ----- tareas de esta clase ----- */}
        <span className="t-label">Tareas que dejaron</span>
        {tareas.map((t, i) => (
          <div key={t.id ?? i} className="eng-taskedit">
            <input
              className="input"
              value={t.text}
              onChange={(e) => setTareas((ts) => ts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              placeholder="Ej: ejercicios página 24"
              maxLength={120}
            />
            <input
              className="input eng-taskedit__due"
              type="date"
              value={t.due ?? ''}
              onChange={(e) =>
                setTareas((ts) => ts.map((x, j) => (j === i ? { ...x, due: e.target.value || undefined } : x)))
              }
            />
            <button
              className="eng-wordedit__del"
              onClick={() => {
                if (t.id) setBorradas((b) => [...b, t.id!])
                setTareas((ts) => ts.filter((_, j) => j !== i))
              }}
              aria-label="Quitar tarea"
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn--block" onClick={() => setTareas((ts) => [...ts, { text: '' }])}>
          ＋ Agregar tarea
        </button>

        <button className="btn btn--primary btn--block" onClick={guardar}>
          Guardar clase
        </button>

        {onDelete && (
          <button className="btn btn--block btn--ghost eng-del" onClick={onDelete}>
            Eliminar esta clase
          </button>
        )}
      </div>
    </Sheet>
  )
}

/* ===========================================================
   Editor de una tarea suelta
   =========================================================== */

function EditorTarea({
  open,
  tarea,
  clases,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  tarea?: EnglishTask
  clases: EnglishLesson[]
  onClose: () => void
  onSave: (datos: { text: string; due?: string; lessonId?: string }) => void
  onDelete?: () => void
}) {
  const [text, setText] = useState(tarea?.text ?? '')
  const [due, setDue] = useState(tarea?.due ?? '')
  const [lessonId, setLessonId] = useState(tarea?.lessonId ?? '')

  const firma = `${open}|${tarea?.id ?? 'nueva'}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setText(tarea?.text ?? '')
    setDue(tarea?.due ?? '')
    setLessonId(tarea?.lessonId ?? '')
  }

  return (
    <Sheet open={open} onClose={onClose} title={tarea ? 'Editar tarea' : 'Nueva tarea'}>
      <div className="stack">
        <div className="field">
          <label>¿Qué tienes que hacer?</label>
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: escribir 10 frases en pasado"
            maxLength={200}
          />
        </div>

        <div className="field">
          <label>¿Para cuándo? (opcional)</label>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>

        {clases.length > 0 && (
          <div className="field">
            <label>¿De qué clase salió? (opcional)</label>
            <select className="input" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">— ninguna —</option>
              {clases.slice(0, 30).map((l) => (
                <option key={l.id} value={l.id}>
                  {labelDia(l.date)} · {l.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn btn--primary btn--block"
          disabled={!text.trim()}
          onClick={() => onSave({ text: text.trim(), due: due || undefined, lessonId: lessonId || undefined })}
        >
          Guardar tarea
        </button>

        {onDelete && (
          <button className="btn btn--block btn--ghost eng-del" onClick={onDelete}>
            Eliminar esta tarea
          </button>
        )}
      </div>
    </Sheet>
  )
}

/* ===========================================================
   Practicar: se muestra una palabra y ella adivina
   =========================================================== */

function Practica({ palabras }: { palabras: { id: string; en: string; es: string; example?: string }[] }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * Math.max(1, palabras.length)))
  const [revelada, setRevelada] = useState(false)
  const [aciertos, setAciertos] = useState(0)

  if (palabras.length === 0) {
    return <p className="screen-sub">Aún no tienes palabras para practicar 💗</p>
  }

  const w = palabras[Math.min(i, palabras.length - 1)]

  function otra(acerte: boolean) {
    if (acerte) setAciertos((a) => a + 1)
    setRevelada(false)
    setI(Math.floor(Math.random() * palabras.length))
  }

  return (
    <div className="stack eng-practica">
      <p className="screen-sub" style={{ textAlign: 'center' }}>
        Llevas <b>{aciertos}</b> {aciertos === 1 ? 'acierto' : 'aciertos'} 💗
      </p>

      <div className="eng-card">
        <span className="eng-card__en">{w.en}</span>
        {revelada ? (
          <>
            <span className="eng-card__es">{w.es}</span>
            {w.example && <p className="eng-card__ej">“{w.example}”</p>}
          </>
        ) : (
          <span className="eng-card__pista">¿qué significa?</span>
        )}
      </div>

      {!revelada ? (
        <button className="btn btn--primary btn--block" onClick={() => setRevelada(true)}>
          Ver respuesta 👀
        </button>
      ) : (
        <div className="eng-practica__botones">
          <button className="btn grow" onClick={() => otra(false)}>
            🙈 No sabía
          </button>
          <button className="btn btn--primary grow" onClick={() => otra(true)}>
            ✅ ¡Sí sabía!
          </button>
        </div>
      )}
    </div>
  )
}
