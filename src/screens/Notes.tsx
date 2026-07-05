import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from '../components/ui/Sheet'
import { uid } from '../lib/id'
import type { Note, NoteColor, NoteItem } from '../data/types'
import './Notes.css'

const COLORS: { key: NoteColor; label: string }[] = [
  { key: 'pink', label: 'Rosa' },
  { key: 'lav', label: 'Lavanda' },
  { key: 'mint', label: 'Menta' },
  { key: 'peach', label: 'Durazno' },
  { key: 'yellow', label: 'Amarillo' },
]

/** Inclinación estable por nota (entre -2.5° y 2.5°). */
function tilt(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return Math.round(((h % 100) / 100) * 50 - 25) / 10
}

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useApp()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Note | null>(null)
  const [creating, setCreating] = useState(false)

  const sorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
      ),
    [notes],
  )

  function togglePin(n: Note) {
    updateNote({ ...n, pinned: !n.pinned })
  }
  function toggleItem(n: Note, itemId: string) {
    updateNote({
      ...n,
      items: (n.items ?? []).map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
    })
  }

  return (
    <main className="screen notes">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Notitas 🎀</h1>
          <p className="screen-sub">Tus ideas, recados y pensamientos 💭</p>
        </div>
        <button className="iconbtn" onClick={() => setCreating(true)} aria-label="Nueva nota">
          ＋
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty__ic">🎀</div>
          <h3>¿Qué anotamos hoy?</h3>
          <p className="screen-sub">Ideas, listas, pendientes… tu michi las cuida 🐱</p>
          <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreating(true)}>
            Crear mi primera notita
          </button>
        </div>
      ) : (
        <div className="notesboard">
          {sorted.map((n) => (
            <div key={n.id} className={`note note--${n.color}`} style={{ transform: `rotate(${tilt(n.id)}deg)` }}>
              <span className="note__tape" />
              <button className="note__pin" onClick={() => togglePin(n)} aria-label="Fijar arriba">
                {n.pinned ? '💖' : '🤍'}
              </button>
              <div className="note__content" onClick={() => setEditing(n)} role="button" tabIndex={0}>
                {n.title && <div className="note__title">{n.title}</div>}
                {n.isChecklist ? (
                  <ul className="note__list">
                    {(n.items ?? []).map((it) => (
                      <li key={it.id} className={it.done ? 'done' : ''}>
                        <button
                          className="note__check"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleItem(n, it.id)
                          }}
                        >
                          {it.done ? '☑️' : '⬜'}
                        </button>
                        <span>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  n.body && <p className="note__text">{n.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteEditor
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(data) => {
          addNote(data)
          setCreating(false)
        }}
      />

      <NoteEditor
        open={!!editing}
        note={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing) updateNote({ ...editing, ...data })
          setEditing(null)
        }}
        onDelete={
          editing
            ? () => {
                if (confirm('¿Borrar esta notita?')) {
                  deleteNote(editing.id)
                  setEditing(null)
                }
              }
            : undefined
        }
      />
    </main>
  )
}

/* ---------- Hoja: crear / editar notita ---------- */
type NoteData = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
function NoteEditor({
  open,
  note,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  note?: Note
  onClose: () => void
  onSave: (data: NoteData) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isChecklist, setIsChecklist] = useState(false)
  const [items, setItems] = useState<NoteItem[]>([])
  const [color, setColor] = useState<NoteColor>('pink')
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(note?.title ?? '')
    setBody(note?.body ?? '')
    setIsChecklist(note?.isChecklist ?? false)
    setItems(note?.items ?? [])
    setColor(note?.color ?? 'pink')
    setPinned(note?.pinned ?? false)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const cleanItems = items.filter((i) => i.text.trim())
  const canSave = !!title.trim() || (isChecklist ? cleanItems.length > 0 : !!body.trim())

  function addItem() {
    setItems((its) => [...its, { id: uid('it'), text: '', done: false }])
  }

  function save() {
    if (!canSave) return
    onSave({
      emoji: undefined,
      title: title.trim() || undefined,
      body: isChecklist ? undefined : body.trim() || undefined,
      items: isChecklist ? cleanItems.map((i) => ({ ...i, text: i.text.trim() })) : undefined,
      isChecklist,
      color,
      pinned,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title={note ? 'Editar notita' : 'Nueva notita 🎀'}>
      <div className="stack">
        <div className="field">
          <label>Título</label>
          <input
            className="input"
            placeholder="Ej: Ideas, Mercado, Pendientes…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Color</label>
          <div className="rowflex" style={{ gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c.key}
                className={`note-swatch note-swatch--${c.key} ${color === c.key ? 'note-swatch--on' : ''}`}
                onClick={() => setColor(c.key)}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Tipo</label>
          <div className="rowflex" style={{ gap: 8 }}>
            <button className={`chip ${!isChecklist ? 'chip--active' : ''}`} onClick={() => setIsChecklist(false)}>
              📝 Texto
            </button>
            <button className={`chip ${isChecklist ? 'chip--active' : ''}`} onClick={() => setIsChecklist(true)}>
              ✅ Lista
            </button>
          </div>
        </div>

        {isChecklist ? (
          <div className="field">
            <label>Lista</label>
            <div className="stack" style={{ gap: 8 }}>
              {items.map((it, i) => (
                <div key={it.id} className="rowflex" style={{ gap: 8 }}>
                  <input
                    className="input"
                    placeholder="Escribe algo…"
                    value={it.text}
                    onChange={(e) =>
                      setItems((its) => its.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                    }
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    className="iconbtn"
                    onClick={() => setItems((its) => its.filter((_, j) => j !== i))}
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={addItem} style={{ alignSelf: 'flex-start' }}>
                ＋ Agregar ítem
              </button>
            </div>
          </div>
        ) : (
          <div className="field">
            <label>Nota</label>
            <textarea
              className="textarea"
              placeholder="Escribe lo que quieras recordar…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <label className="rem-toggle">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          <span>💖 Fijar arriba</span>
        </label>

        <button className="btn btn--primary btn--block" disabled={!canSave} onClick={save}>
          {note ? 'Guardar cambios' : 'Crear notita'}
        </button>

        {onDelete && (
          <button className="btn btn--ghost btn--block" onClick={onDelete}>
            🗑️ Borrar notita
          </button>
        )}
      </div>
    </Sheet>
  )
}
