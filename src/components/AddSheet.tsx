import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from './ui/Sheet'
import Cat from './Cat/Cat'
import PeekCat from './PeekCat'
import { useApp } from '../store/store'
import { parseAmountToCents, currencySymbol } from '../lib/money'
import { PALETTE } from '../data/seed'
import { accountCurrency, type Category, type Movement, type MovementType } from '../data/types'
import Money from './Money'
import './AddSheet.css'

interface AddSheetProps {
  open: boolean
  edit?: Movement | null
  onClose: () => void
}

type Step = 'type' | 'form' | 'done'

const TYPE_META: Record<
  MovementType,
  { label: string; emoji: string; cls: string; verb: string }
> = {
  income: { label: 'Ingreso', emoji: '💚', cls: 'income', verb: 'Entró' },
  expense: { label: 'Gasto', emoji: '🛍️', cls: 'expense', verb: 'Salió' },
  transfer: { label: 'Transferencia', emoji: '🔁', cls: 'transfer', verb: 'Moviste' },
  adjust: { label: 'Ajuste de saldo', emoji: '⚖️', cls: 'adjust', verb: 'Ajuste' },
}

export default function AddSheet({ open, edit, onClose }: AddSheetProps) {
  const { accounts, categories, addMovement, updateMovement, deleteMovement, addCategory, addAccount } =
    useApp()

  // Crea una cuenta de persona/deuda al vuelo (en $0) y la deja seleccionada.
  function createPerson(name: string, select: (id: string) => void) {
    const acc = addAccount({
      name,
      emoji: '👤',
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      currency: 'COP',
      kind: 'person',
    })
    select(acc.id)
  }
  const navigate = useNavigate()
  const active = useMemo(() => accounts.filter((a) => !a.archived && !a.deleted), [accounts])
  // para elegir/buscar: incluye archivadas (activas primero), nunca eliminadas
  const pickAccounts = useMemo(
    () =>
      accounts
        .filter((a) => !a.deleted)
        .sort((a, b) => Number(!!a.archived) - Number(!!b.archived) || a.order - b.order),
    [accounts],
  )
  const isEdit = !!edit

  const [step, setStep] = useState<Step>('type')
  const [type, setType] = useState<MovementType>('expense')
  const [amountRaw, setAmountRaw] = useState('')
  const [amountToRaw, setAmountToRaw] = useState('')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    if (edit) {
      setStep('form')
      setType(edit.type)
      setAmountRaw(String(edit.amount / 100))
      setAmountToRaw(edit.amountTo !== undefined ? String(edit.amountTo / 100) : '')
      setCategoryId(edit.categoryId ?? '')
      setNote(edit.note ?? '')
      setDirection(edit.direction ?? 'in')
      setAccountId(edit.accountId)
      setToAccountId(edit.toAccountId ?? active.find((a) => a.id !== edit.accountId)?.id ?? '')
    } else {
      setStep('type')
      setAmountRaw('')
      setAmountToRaw('')
      setCategoryId('')
      setNote('')
      setDirection('in')
      setAccountId('') // sin cuenta por defecto: siempre hay que elegirla
      setToAccountId('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras la hoja está abierta, escondemos el gato de fondo (Inicio/Tokens/
  // Tienda/buddy) para que solo se vea el gatito chismoso y no rompa la ilusión.
  useEffect(() => {
    document.body.classList.toggle('addsheet-open', open)
    return () => document.body.classList.remove('addsheet-open')
  }, [open])

  const cents = parseAmountToCents(amountRaw)
  const centsTo = parseAmountToCents(amountToRaw)
  const meta = TYPE_META[type]
  const needsCategory = type === 'income' || type === 'expense'

  const srcAcc = accounts.find((a) => a.id === accountId)
  const dstAcc = accounts.find((a) => a.id === toAccountId)
  const srcCur = srcAcc ? accountCurrency(srcAcc) : 'COP'
  const dstCur = dstAcc ? accountCurrency(dstAcc) : 'COP'
  // transferencia entre monedas distintas → pide "cuánto llega" y queda pendiente
  const isCross = type === 'transfer' && !!dstAcc && srcCur !== dstCur

  const canSave =
    cents > 0 &&
    !!accountId &&
    (!needsCategory || !!categoryId) &&
    (type !== 'transfer' || (!!toAccountId && toAccountId !== accountId)) &&
    (!isCross || centsTo > 0)

  function pickType(t: MovementType) {
    setType(t)
    setStep('form')
  }

  function save() {
    if (!canSave) return
    if (edit) {
      updateMovement({
        ...edit,
        type,
        amount: cents,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        amountTo: isCross ? centsTo : undefined,
        // al editar se conserva EXACTO el estado pendiente (no re-pendiente lo ya confirmado);
        // para marcar la llegada está el botón "Confirmar" aparte.
        pending: isCross ? edit.pending : undefined,
        categoryId: type === 'income' || type === 'expense' ? categoryId || undefined : undefined,
        direction: type === 'adjust' ? direction : undefined,
        note: note.trim() || undefined,
      })
      onClose()
      return
    }
    addMovement({
      type,
      amount: cents,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      amountTo: isCross ? centsTo : undefined,
      pending: isCross ? true : undefined,
      categoryId: type === 'income' || type === 'expense' ? categoryId || undefined : undefined,
      direction: type === 'adjust' ? direction : undefined,
      note,
    })
    setStep('done')
    window.setTimeout(() => {
      onClose()
    }, 1300)
  }

  // Confirmar que una transferencia pendiente YA llegó (acredita el destino).
  function confirmArrival() {
    if (!edit || centsTo <= 0) return
    updateMovement({ ...edit, amountTo: centsTo, pending: undefined })
    onClose()
  }

  function remove() {
    if (!edit) return
    if (confirm('¿Borrar este movimiento? Los saldos se recalculan solos.')) {
      deleteMovement(edit.id)
      onClose()
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar movimiento' : step === 'type' ? '¿Qué registramos?' : undefined}
      peek={step === 'type' ? <PeekCat /> : null}
    >
      {step === 'type' && (
        <div className="typegrid">
          <button className="typebtn typebtn--income" onClick={() => pickType('income')}>
            <span className="typebtn__emoji">💚</span>
            <span>Ingreso</span>
          </button>
          <button className="typebtn typebtn--expense" onClick={() => pickType('expense')}>
            <span className="typebtn__emoji">🛍️</span>
            <span>Gasto</span>
          </button>
          <button className="typebtn typebtn--transfer" onClick={() => pickType('transfer')}>
            <span className="typebtn__emoji">🔁</span>
            <span>Transferencia</span>
          </button>
          <button className="adjustlink" onClick={() => pickType('adjust')}>
            ⚖️ Ajuste de saldo
          </button>
        </div>
      )}

      {step === 'form' && (
        <div className={`addform addform--${meta.cls}`}>
          <button className="addform__back" onClick={() => (isEdit ? onClose() : setStep('type'))}>
            ‹ {meta.emoji} {meta.label}
          </button>

          {active.length === 0 ? (
            <div className="empty" style={{ paddingBottom: 20 }}>
              <h3>Primero una cuenta 💳</h3>
              <p>Crea una cuenta (Nequi, Efectivo…) para empezar a registrar.</p>
              <button
                className="btn btn--primary btn--block"
                style={{ marginTop: 14 }}
                onClick={() => {
                  onClose()
                  navigate('/cuentas')
                }}
              >
                Crear mi primera cuenta
              </button>
            </div>
          ) : (
            <>
              {/* Monto — un solo número grande (en la moneda de la cuenta) */}
              <div className={`amount amount--${meta.cls}`}>
                <span className="amount__cur">{currencySymbol(srcCur)}</span>
                <input
                  className="amount__big"
                  inputMode="decimal"
                  placeholder="0"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value)}
                />
              </div>
              {type === 'transfer' && (
                <p className="addform__hint" style={{ marginTop: -4 }}>
                  {isCross ? (
                    <>Sale de tu cuenta en {srcCur === 'USD' ? 'dólares' : 'pesos'} 💸</>
                  ) : (
                    <>Se mueve entre tus cuentas 🔁</>
                  )}
                </p>
              )}

              {/* Cuenta */}
              <div className="field">
                <label>{type === 'transfer' ? 'Desde' : 'Cuenta'}</label>
                <AccountPicker
                  accounts={pickAccounts}
                  value={accountId}
                  onChange={setAccountId}
                  onCreate={(name) => createPerson(name, setAccountId)}
                />
              </div>

              {/* Transfer destino */}
              {type === 'transfer' && (
                <div className="field">
                  <label>Hacia</label>
                  <AccountPicker
                    accounts={pickAccounts}
                    value={toAccountId}
                    onChange={setToAccountId}
                    exclude={accountId}
                    onCreate={(name) => createPerson(name, setToAccountId)}
                  />
                </div>
              )}

              {/* Cross-currency: cuánto LLEGA a la cuenta destino */}
              {isCross && (
                <div className="field">
                  <label>¿Cuánto llegará en {dstCur === 'USD' ? 'dólares' : 'pesos'}? *</label>
                  <div className="rowflex" style={{ alignItems: 'center', gap: 8 }}>
                    <span className="amount__cur" style={{ fontSize: 20 }}>
                      {currencySymbol(dstCur)}
                    </span>
                    <input
                      className="input"
                      inputMode="decimal"
                      placeholder="0"
                      value={amountToRaw}
                      onChange={(e) => setAmountToRaw(e.target.value)}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                  <p className="addform__hint">
                    💱 Pon lo que te dicen que vas a recibir (ej: lo que PayPal muestra al retirar).
                    Como el valor puede cambiar y demorar, queda <b>pendiente</b> hasta que confirmes
                    que llegó — así no te muestra plata de más.
                  </p>
                </div>
              )}

              {/* Categoría (ingreso/gasto) — obligatoria */}
              {(type === 'income' || type === 'expense') && (
                <div className="field">
                  <label>Categoría *</label>
                  <CategoryPicker
                    categories={categories}
                    value={categoryId}
                    onSelect={setCategoryId}
                    onCreate={(name) => {
                      const cat = addCategory({
                        name,
                        emoji: '🏷️',
                        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                      })
                      setCategoryId(cat.id)
                    }}
                  />
                </div>
              )}

              {/* Dirección (ajuste) */}
              {type === 'adjust' && (
                <div className="field">
                  <label>Tipo de ajuste</label>
                  <div className="rowflex">
                    <button
                      className={`chip ${direction === 'in' ? 'chip--active' : ''}`}
                      onClick={() => setDirection('in')}
                    >
                      ➕ Sumar
                    </button>
                    <button
                      className={`chip ${direction === 'out' ? 'chip--active' : ''}`}
                      onClick={() => setDirection('out')}
                    >
                      ➖ Restar
                    </button>
                  </div>
                  <p className="addform__hint">No cuenta como ingreso/gasto en tus estadísticas.</p>
                </div>
              )}

              {/* Nota */}
              <div className="field">
                <label>Nota (opcional)</label>
                <input
                  className="input"
                  placeholder="Ej: pago tatuaje brazo…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Confirmar llegada de una transferencia pendiente */}
              {isEdit && edit?.type === 'transfer' && edit?.pending && (
                <div className="pending-box">
                  <p className="pending-box__title">⏳ En camino</p>
                  <p className="addform__hint" style={{ marginTop: 0 }}>
                    Salió <Money value={edit.amount} currency={srcCur} /> de {srcAcc?.name ?? 'origen'}.
                    Cuando el dinero llegue a {dstAcc?.name ?? 'destino'}, ajusta arriba cuánto llegó
                    de verdad y confirma.
                  </p>
                  <button
                    className="btn btn--income btn--block"
                    disabled={centsTo <= 0}
                    onClick={confirmArrival}
                  >
                    ✅ Confirmar que ya llegó ({currencySymbol(dstCur)}
                    {amountToRaw || '0'})
                  </button>
                </div>
              )}

              <button
                className={`btn btn--${meta.cls} btn--block`}
                disabled={!canSave}
                onClick={save}
              >
                {isEdit ? 'Guardar cambios' : `Guardar ${meta.label.toLowerCase()}`}
              </button>

              {isEdit && (
                <button className="btn btn--ghost btn--block" onClick={remove}>
                  🗑️ Borrar movimiento
                </button>
              )}
            </>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="done">
          <Cat size={140} mood="celebrate" alive={false} />
          <h3>¡Guardado! 🎉</h3>
          <p className="t-soft">Cuentas al día 💗</p>
        </div>
      )}
    </Sheet>
  )
}

/* --------- Selector de cuenta en chips --------- */
/* --------- Selector de cuenta con búsqueda (incluye archivadas) --------- */
function AccountPicker({
  accounts,
  value,
  onChange,
  exclude,
  onCreate,
}: {
  accounts: { id: string; name: string; emoji: string; archived?: boolean }[]
  value: string
  onChange: (id: string) => void
  exclude?: string
  onCreate?: (name: string) => void
}) {
  const [q, setQ] = useState('')
  const [openList, setOpenList] = useState(false)
  const options = accounts.filter((a) => a.id !== exclude)
  const selected = options.find((a) => a.id === value)
  const needle = q.trim().toLowerCase()
  const filtered = needle ? options.filter((a) => a.name.toLowerCase().includes(needle)) : options
  const exact = accounts.some((a) => a.name.toLowerCase() === needle)

  if (selected && !openList) {
    return (
      <button
        className="cat-selected"
        onClick={() => {
          setOpenList(true)
          setQ('')
        }}
      >
        {selected.emoji} {selected.name}
        {selected.archived && <span className="curtag">archivada</span>}
        <span className="cat-selected__change">cambiar</span>
      </button>
    )
  }

  return (
    <div className="catpicker">
      <input
        className="input"
        placeholder="Busca una cuenta…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpenList(true)}
      />
      <div className="catpicker__list no-scrollbar">
        {filtered.map((a) => (
          <button
            key={a.id}
            className="catpicker__opt"
            onClick={() => {
              onChange(a.id)
              setOpenList(false)
            }}
          >
            {a.emoji} {a.name}
            {a.archived && <span className="curtag">archivada</span>}
          </button>
        ))}
        {onCreate && q.trim() && !exact && (
          <button
            className="catpicker__opt catpicker__create"
            onClick={() => {
              onCreate(q.trim())
              setOpenList(false)
              setQ('')
            }}
          >
            ➕ Crear persona «{q.trim()}»
          </button>
        )}
      </div>
    </div>
  )
}

/* --------- Selector de categoría con autocompletado --------- */
function CategoryPicker({
  categories,
  value,
  onSelect,
  onCreate,
}: {
  categories: Category[]
  value: string
  onSelect: (id: string) => void
  onCreate: (name: string) => void
}) {
  const [q, setQ] = useState('')
  const [openList, setOpenList] = useState(false)
  const selected = categories.find((c) => c.id === value)

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories],
  )
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return sorted
    return sorted.filter((c) => c.name.toLowerCase().includes(needle))
  }, [sorted, q])

  const exact = categories.some((c) => c.name.toLowerCase() === q.trim().toLowerCase())

  if (selected && !openList) {
    return (
      <button
        className="cat-selected"
        onClick={() => {
          setOpenList(true)
          setQ('')
        }}
      >
        <span className="cat-dot" style={{ background: selected.color }} />
        {selected.emoji} {selected.name}
        <span className="cat-selected__change">cambiar</span>
      </button>
    )
  }

  return (
    <div className="catpicker">
      <input
        className="input"
        placeholder="Busca o crea una categoría…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpenList(true)}
      />
      <div className="catpicker__list no-scrollbar">
        {filtered.map((c) => (
          <button
            key={c.id}
            className="catpicker__opt"
            onClick={() => {
              onSelect(c.id)
              setOpenList(false)
            }}
          >
            <span className="cat-dot" style={{ background: c.color }} />
            {c.emoji} {c.name}
          </button>
        ))}
        {q.trim() && !exact && (
          <button
            className="catpicker__opt catpicker__create"
            onClick={() => {
              onCreate(q.trim())
              setOpenList(false)
            }}
          >
            ➕ Crear «{q.trim()}»
          </button>
        )}
      </div>
    </div>
  )
}
