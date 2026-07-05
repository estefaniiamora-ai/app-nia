import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/store'
import Money from '../components/Money'
import Sheet from '../components/ui/Sheet'
import { allBalances, debtSummary } from '../data/selectors'
import { PALETTE } from '../data/seed'
import { lastEmoji } from '../lib/emoji'
import { parseAmountToCents } from '../lib/money'
import {
  accountCurrency,
  accountKind,
  isPersonAccount,
  type Account,
  type AccountKind,
  type Currency,
  type PaymentReminder,
  type ReminderFreq,
} from '../data/types'
import { reminderStatus, sortedReminders, FREQ_LABEL } from '../data/reminders'
import { localDayKey } from '../lib/date'
import './Accounts.css'

const EMOJI_SUGGEST = ['💵', '🏦', '🐷', '💳', '📱', '💖', '✨', '🪙', '👛', '🎀']
const REM_EMOJIS = ['🏠', '💡', '📺', '📱', '💳', '🚗', '💊', '🎓', '🛒', '💖']
const FREQS: { key: ReminderFreq; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'biweekly', label: 'Quincenal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'bimonthly', label: 'Cada 2 meses' },
]

function dayKeyToTs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getTime()
}

export default function Accounts() {
  const {
    accounts,
    movements,
    reminders,
    addAccount,
    updateAccount,
    archiveAccount,
    deleteAccount,
    addMovement,
    addReminder,
    updateReminder,
    deleteReminder,
    markReminderPaid,
  } = useApp()

  const accountHasMovements = (id: string) =>
    movements.some((m) => m.accountId === id || m.toAccountId === id)
  const balances = useMemo(() => allBalances(movements), [movements])

  const active = accounts.filter((a) => !a.archived && !a.deleted).sort((a, b) => a.order - b.order)
  const normalActive = active.filter((a) => !isPersonAccount(a))
  const persons = active.filter((a) => isPersonAccount(a))
  const archived = accounts.filter((a) => a.archived && !a.deleted)
  const debts = useMemo(() => debtSummary(accounts, movements), [accounts, movements])

  const [editing, setEditing] = useState<Account | null>(null)
  const [createKind, setCreateKind] = useState<AccountKind | null>(null)
  const [editRem, setEditRem] = useState<PaymentReminder | null>(null)
  const [creatingRem, setCreatingRem] = useState(false)

  const remList = useMemo(() => sortedReminders(reminders), [reminders])
  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name

  return (
    <main className="screen">
      <div className="screen-head">
        <div>
          <h1>Cuentas 💳</h1>
          <p className="screen-sub">Dónde tienes tu plata</p>
        </div>
        <button className="iconbtn" onClick={() => setCreateKind('normal')} aria-label="Nueva cuenta">
          ＋
        </button>
      </div>

      {normalActive.length === 0 ? (
        <div className="card empty">
          <h3>Aún no tienes cuentas 🐱</h3>
          <p>Crea tu primera cuenta: Nequi, Efectivo, Bancolombia… la que uses.</p>
          <button className="btn btn--primary btn--block" style={{ marginTop: 14 }} onClick={() => setCreateKind('normal')}>
            Crear cuenta
          </button>
        </div>
      ) : (
        <div className="list">
          {normalActive.map((a) => {
            const bal = balances.get(a.id) ?? 0
            return (
              <button key={a.id} className="row" onClick={() => setEditing(a)} style={{ textAlign: 'left', width: '100%' }}>
                <span
                  className="row__icon"
                  style={{ background: a.color ? hexTint(a.color) : 'var(--primary-tint)' }}
                >
                  {a.emoji}
                </span>
                <span className="row__main">
                  <span className="row__title">
                    {a.name}
                    {accountCurrency(a) === 'USD' && <span className="curtag">USD 🇺🇸</span>}
                  </span>
                  <span className="row__sub">Toca para editar</span>
                </span>
                <span className="row__right" style={{ color: bal < 0 ? 'var(--expense)' : undefined }}>
                  <Money value={bal} currency={accountCurrency(a)} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Personas / deudas — no cuentan en el Saldo total */}
      <section className="stack" style={{ gap: 10, marginTop: 14 }}>
        <div className="spread">
          <span className="t-title">👤 Personas / deudas</span>
          <button className="chip" onClick={() => setCreateKind('person')}>＋ Nueva</button>
        </div>

        {persons.length === 0 ? (
          <div className="card empty" style={{ padding: '16px 16px' }}>
            <p style={{ margin: 0 }}>
              ¿Alguien te debe o le debes? Crea una persona. En <b>+</b> te deben, en <b>−</b> le
              debes. Al saldar la deuda (llegar a $0) se archiva sola. 🤝
            </p>
          </div>
        ) : (
          <>
            <div className="debtsum">
              <span className="debtsum__item debtsum__item--owed">
                Te deben <b><Money value={debts.owed} /></b>
              </span>
              <span className="debtsum__item debtsum__item--debt">
                Debes <b><Money value={debts.debt} /></b>
              </span>
            </div>
            <div className="list">
              {persons.map((a) => {
                const bal = balances.get(a.id) ?? 0
                const owed = bal > 0
                return (
                  <button key={a.id} className="row" onClick={() => setEditing(a)} style={{ textAlign: 'left', width: '100%' }}>
                    <span
                      className="row__icon"
                      style={{ background: a.color ? hexTint(a.color) : 'var(--primary-tint)' }}
                    >
                      {a.emoji}
                    </span>
                    <span className="row__main">
                      <span className="row__title">{a.name}</span>
                      <span className="row__sub">{owed ? 'Te debe' : bal < 0 ? 'Le debes' : 'Saldado'}</span>
                    </span>
                    <span className="row__right" style={{ color: bal < 0 ? 'var(--expense)' : 'var(--income)' }}>
                      <Money value={bal} currency={accountCurrency(a)} />
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>

      {archived.length > 0 && (
        <details className="archived">
          <summary>Archivadas ({archived.length})</summary>
          <div className="list" style={{ marginTop: 10 }}>
            {archived.map((a) => (
              <div key={a.id} className="row" style={{ opacity: 0.7 }}>
                <span className="row__icon">{a.emoji}</span>
                <span className="row__main">
                  <span className="row__title">{a.name}</span>
                  <span className="row__sub">Archivada</span>
                </span>
                <button className="btn btn--sm btn--ghost" onClick={() => archiveAccount(a.id, false)}>
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Recordatorios de pago */}
      <section className="stack" style={{ gap: 10, marginTop: 8 }}>
        <div className="spread">
          <span className="t-title">🔔 Recordatorios de pago</span>
          <button className="chip" onClick={() => setCreatingRem(true)}>＋ Nuevo</button>
        </div>

        {remList.length === 0 ? (
          <div className="card empty" style={{ padding: '18px 16px' }}>
            <p style={{ margin: 0 }}>
              Anota lo que debes pagar (arriendo, servicios, subs…) y te recuerda cuándo. 🗓️
            </p>
            <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} onClick={() => setCreatingRem(true)}>
              Crear recordatorio
            </button>
          </div>
        ) : (
          <div className="list">
            {remList.map((r) => {
              const st = reminderStatus(r)
              const dim = !r.active || r.done
              return (
                <div key={r.id} className={`row rem ${dim ? 'rem--dim' : ''}`}>
                  <button className="rem__main" onClick={() => setEditRem(r)}>
                    <span className="row__icon">{r.emoji || '🔔'}</span>
                    <span className="row__main">
                      <span className="row__title">{r.name}</span>
                      <span className="row__sub">
                        {r.amount ? <><Money value={r.amount} /> · </> : ''}
                        {r.periodic && r.freq ? FREQ_LABEL[r.freq] : 'una vez'}
                        {accName(r.accountId) ? ` · ${accName(r.accountId)}` : ''}
                      </span>
                    </span>
                  </button>
                  {r.done ? (
                    <span className="rem__pill rem__pill--done">✓ pagado</span>
                  ) : !r.active ? (
                    <span className="rem__pill rem__pill--off">pausado</span>
                  ) : (
                    <button
                      className={`rem__pill rem__pill--${st.state}`}
                      title="Marcar como pagado"
                      onClick={() => markReminderPaid(r.id)}
                    >
                      {st.label}
                    </button>
                  )}
                </div>
              )
            })}
            <p className="screen-sub" style={{ textAlign: 'center', marginTop: 2 }}>
              Toca la fechita para marcar “ya lo pagué” ✅
            </p>
          </div>
        )}
      </section>

      <AccountEditor
        open={createKind !== null}
        initialKind={createKind ?? 'normal'}
        onClose={() => setCreateKind(null)}
        onSave={(data) => {
          const acc = addAccount({
            name: data.name,
            emoji: data.emoji,
            color: data.color,
            currency: data.currency,
            kind: data.kind,
          })
          if (data.initialCents !== 0) {
            addMovement({
              type: 'adjust',
              amount: Math.abs(data.initialCents),
              accountId: acc.id,
              direction: data.initialCents < 0 ? 'out' : 'in',
              note: 'Saldo inicial',
            })
          }
          setCreateKind(null)
        }}
      />

      <AccountEditor
        open={!!editing}
        account={editing ?? undefined}
        balance={editing ? balances.get(editing.id) ?? 0 : 0}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing)
            updateAccount({
              ...editing,
              name: data.name,
              emoji: data.emoji,
              color: data.color,
              currency: editing.currency ?? 'COP',
            })
          setEditing(null)
        }}
        onArchive={
          editing
            ? () => {
                archiveAccount(editing.id, true)
                setEditing(null)
              }
            : undefined
        }
        onDelete={
          editing
            ? () => {
                const hasMov = accountHasMovements(editing.id)
                const msg = hasMov
                  ? '¿Eliminar esta cuenta? Sus movimientos quedarán en tu historial, pero ya no podrás usarla.'
                  : '¿Eliminar esta cuenta?'
                if (confirm(msg)) {
                  if (hasMov) updateAccount({ ...editing, deleted: true })
                  else deleteAccount(editing.id)
                  setEditing(null)
                }
              }
            : undefined
        }
      />

      <ReminderEditor
        open={creatingRem}
        accounts={active}
        onClose={() => setCreatingRem(false)}
        onSave={(data) => {
          addReminder(data)
          setCreatingRem(false)
        }}
      />

      <ReminderEditor
        open={!!editRem}
        reminder={editRem ?? undefined}
        accounts={active}
        onClose={() => setEditRem(null)}
        onSave={(data) => {
          if (editRem) updateReminder({ ...editRem, ...data })
          setEditRem(null)
        }}
        onPaid={editRem ? () => { markReminderPaid(editRem.id); setEditRem(null) } : undefined}
        onDelete={
          editRem
            ? () => {
                if (confirm('¿Borrar este recordatorio?')) {
                  deleteReminder(editRem.id)
                  setEditRem(null)
                }
              }
            : undefined
        }
      />
    </main>
  )
}

/* ---------- Hoja: crear / editar recordatorio de pago ---------- */
type RemData = Omit<PaymentReminder, 'id' | 'createdAt'>
function ReminderEditor({
  open,
  reminder,
  accounts,
  onClose,
  onSave,
  onPaid,
  onDelete,
}: {
  open: boolean
  reminder?: PaymentReminder
  accounts: Account[]
  onClose: () => void
  onSave: (data: RemData) => void
  onPaid?: () => void
  onDelete?: () => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🔔')
  const [amountRaw, setAmountRaw] = useState('')
  const [accountId, setAccountId] = useState<string>('')
  const [periodic, setPeriodic] = useState(true)
  const [freq, setFreq] = useState<ReminderFreq>('monthly')
  const [dayKey, setDayKey] = useState(localDayKey())
  const [note, setNote] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setName(reminder?.name ?? '')
    setEmoji(reminder?.emoji ?? '🔔')
    setAmountRaw(reminder?.amount ? String(reminder.amount / 100) : '')
    setAccountId(reminder?.accountId ?? '')
    setPeriodic(reminder?.periodic ?? true)
    setFreq(reminder?.freq ?? 'monthly')
    setDayKey(localDayKey(reminder?.nextDate ?? Date.now()))
    setNote(reminder?.note ?? '')
    setActive(reminder?.active ?? true)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const amount = parseAmountToCents(amountRaw)
  const canSave = !!name.trim() && !!dayKey

  function save() {
    if (!canSave) return
    onSave({
      name: name.trim(),
      emoji: emoji || undefined,
      amount: amount > 0 ? amount : undefined,
      accountId: accountId || undefined,
      periodic,
      freq: periodic ? freq : undefined,
      nextDate: dayKeyToTs(dayKey),
      note: note.trim() || undefined,
      active,
      done: reminder?.done && !periodic ? reminder.done : false,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title={reminder ? 'Editar recordatorio' : 'Nuevo recordatorio 🔔'}>
      <div className="stack">
        <div className="field">
          <label>¿Qué debes pagar?</label>
          <div className="rowflex">
            <input
              className="input emoji-input"
              value={emoji}
              onChange={(e) => setEmoji(lastEmoji(e.target.value))}
              aria-label="Emoji"
            />
            <input
              className="input"
              placeholder="Ej: Arriendo, Netflix, Luz…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
          <div className="chips-scroll no-scrollbar" style={{ marginTop: 2 }}>
            {REM_EMOJIS.map((e) => (
              <button key={e} className={`emoji-chip ${emoji === e ? 'emoji-chip--on' : ''}`} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Monto (opcional)</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
          />
        </div>

        {accounts.length > 0 && (
          <div className="field">
            <label>Cuenta (opcional)</label>
            <div className="chips-scroll no-scrollbar">
              <button className={`chip ${accountId === '' ? 'chip--active' : ''}`} onClick={() => setAccountId('')}>
                Ninguna
              </button>
              {accounts.map((a) => (
                <button
                  key={a.id}
                  className={`chip ${accountId === a.id ? 'chip--active' : ''}`}
                  onClick={() => setAccountId(a.id)}
                >
                  {a.emoji} {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>Tipo</label>
          <div className="rowflex" style={{ gap: 8 }}>
            <button className={`chip ${!periodic ? 'chip--active' : ''}`} onClick={() => setPeriodic(false)}>
              Una vez
            </button>
            <button className={`chip ${periodic ? 'chip--active' : ''}`} onClick={() => setPeriodic(true)}>
              Periódico
            </button>
          </div>
        </div>

        {periodic && (
          <div className="field">
            <label>Cada cuánto</label>
            <div className="rowflex" style={{ flexWrap: 'wrap', gap: 8 }}>
              {FREQS.map((f) => (
                <button
                  key={f.key}
                  className={`chip ${freq === f.key ? 'chip--active' : ''}`}
                  onClick={() => setFreq(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>{periodic ? 'Próximo pago' : 'Fecha de pago'}</label>
          <input className="input" type="date" value={dayKey} onChange={(e) => setDayKey(e.target.value)} />
        </div>

        <div className="field">
          <label>Nota (opcional)</label>
          <input className="input" placeholder="Ej: pagar antes del 5…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {reminder && (
          <label className="rem-toggle">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Activo (recuérdame este pago)</span>
          </label>
        )}

        <button className="btn btn--primary btn--block" disabled={!canSave} onClick={save}>
          {reminder ? 'Guardar cambios' : 'Crear recordatorio'}
        </button>

        {onPaid && !reminder?.done && (
          <button className="btn btn--income btn--block" onClick={onPaid}>
            ✅ Ya lo pagué
          </button>
        )}

        {onDelete && (
          <button className="btn btn--ghost btn--block" onClick={onDelete}>
            🗑️ Borrar recordatorio
          </button>
        )}
      </div>
    </Sheet>
  )
}

function AccountEditor({
  open,
  account,
  initialKind = 'normal',
  balance = 0,
  onClose,
  onSave,
  onArchive,
  onDelete,
}: {
  open: boolean
  account?: Account
  initialKind?: AccountKind
  balance?: number
  onClose: () => void
  onSave: (data: { name: string; emoji: string; color: string; currency: Currency; kind: AccountKind; initialCents: number }) => void
  onArchive?: () => void
  onDelete?: () => void
}) {
  // tipo de la cuenta que se está creando/editando (fijo al editar)
  const kind: AccountKind = account ? accountKind(account) : initialKind
  const isPerson = kind === 'person'

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💵')
  const [color, setColor] = useState('')
  const [currency, setCurrency] = useState<Currency>('COP')
  const [balRaw, setBalRaw] = useState('')
  const [sign, setSign] = useState<'pos' | 'neg'>('pos') // solo persona: + te deben / − le debes

  useEffect(() => {
    if (open) {
      setName(account?.name ?? '')
      setSign('pos')
      setEmoji(account?.emoji ?? (isPerson ? '👤' : EMOJI_SUGGEST[Math.floor(Math.random() * EMOJI_SUGGEST.length)]))
      // sugerir un color si no tiene
      setColor(account?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)])
      setCurrency(account ? accountCurrency(account) : 'COP')
      setBalRaw('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const rawCents = Math.abs(parseAmountToCents(balRaw))
  const initialCents = isPerson && sign === 'neg' ? -rawCents : rawCents
  // la persona puede quedar en 0 (deuda nueva que se llena con un traspaso)
  const missingBalance = !account && !isPerson && balRaw.trim() === ''

  const title = account
    ? isPerson
      ? 'Editar persona'
      : 'Editar cuenta'
    : isPerson
      ? 'Nueva persona 👤'
      : 'Nueva cuenta'

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="acc-preview">
          <span className="acc-preview__icon" style={{ background: color ? hexTint(color) : 'var(--primary-tint)' }}>
            {emoji || '💼'}
          </span>
          <span className="acc-preview__name">{name || (isPerson ? 'Nombre de la persona' : 'Nombre de la cuenta')}</span>
        </div>

        <div className="field">
          <label>Nombre</label>
          <input
            className="input"
            placeholder={isPerson ? 'Ej: Camilo' : 'Ej: Nequi'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Emoji</label>
          <div className="rowflex">
            <input
              className="input emoji-input"
              value={emoji}
              onChange={(e) => setEmoji(lastEmoji(e.target.value))}
              placeholder="😺"
              aria-label="Emoji de la cuenta"
            />
            <div className="chips-scroll no-scrollbar">
              {EMOJI_SUGGEST.map((e) => (
                <button key={e} className={`emoji-chip ${emoji === e ? 'emoji-chip--on' : ''}`} onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <p className="screen-sub" style={{ paddingLeft: 2 }}>
            Toca el cuadro y abre el teclado de emojis 😺 — el que quieras. Los de la derecha son atajos.
          </p>
        </div>

        <div className="field">
          <label>Color</label>
          <div className="swatches">
            <button
              className={`swatch swatch--none ${!color ? 'swatch--on' : ''}`}
              onClick={() => setColor('')}
              title="Sin color"
            >
              ∅
            </button>
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c ? 'swatch--on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {!isPerson &&
          (!account ? (
            <div className="field">
              <label>Moneda</label>
              <div className="rowflex" style={{ gap: 8 }}>
                <button
                  type="button"
                  className={`chip ${currency === 'COP' ? 'chip--active' : ''}`}
                  onClick={() => setCurrency('COP')}
                >
                  🇨🇴 Pesos (COP)
                </button>
                <button
                  type="button"
                  className={`chip ${currency === 'USD' ? 'chip--active' : ''}`}
                  onClick={() => setCurrency('USD')}
                >
                  🇺🇸 Dólares (USD)
                </button>
              </div>
              <p className="screen-sub" style={{ paddingLeft: 2 }}>
                Esta cuenta manejará solo <b>{currency === 'USD' ? 'dólares' : 'pesos'}</b>. No se puede
                cambiar después.
              </p>
            </div>
          ) : (
            <div className="field">
              <label>Moneda</label>
              <p className="screen-sub" style={{ paddingLeft: 2 }}>
                {accountCurrency(account) === 'USD' ? '🇺🇸 Dólares (USD)' : '🇨🇴 Pesos (COP)'} — no se
                puede cambiar.
              </p>
            </div>
          ))}

        {!account && !isPerson && (
          <div className="field">
            <label>Saldo inicial</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={balRaw}
              onChange={(e) => setBalRaw(e.target.value)}
            />
            <p className="screen-sub" style={{ paddingLeft: 2 }}>
              ¿Cuánto hay en esta cuenta ahora? Si está vacía, escribe <b>0</b>.{' '}
              {initialCents !== 0 && (
                <>
                  Empezará con <Money value={initialCents} currency={currency} />.
                </>
              )}
              <br />
              No cuenta como ingreso en tus estadísticas.
            </p>
          </div>
        )}

        {!account && isPerson && (
          <div className="field">
            <label>¿Ya hay una deuda? (opcional)</label>
            <div className="rowflex" style={{ gap: 8 }}>
              <button
                type="button"
                className={`chip ${sign === 'pos' ? 'chip--active' : ''}`}
                onClick={() => setSign('pos')}
              >
                ➕ Me debe
              </button>
              <button
                type="button"
                className={`chip ${sign === 'neg' ? 'chip--active' : ''}`}
                onClick={() => setSign('neg')}
              >
                ➖ Le debo
              </button>
            </div>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={balRaw}
              onChange={(e) => setBalRaw(e.target.value)}
              style={{ marginTop: 8 }}
            />
            <p className="screen-sub" style={{ paddingLeft: 2 }}>
              {rawCents !== 0 ? (
                sign === 'neg' ? (
                  <>Le debes <Money value={rawCents} />.</>
                ) : (
                  <>Te debe <Money value={rawCents} />.</>
                )
              ) : (
                <>Déjalo en <b>0</b> si la deuda nace con un traspaso (ej: le prestas ahora).</>
              )}
              <br />
              No cuenta en tu Saldo total ni en tus estadísticas.
            </p>
          </div>
        )}

        <button
          className="btn btn--primary btn--block"
          disabled={!name.trim() || missingBalance}
          onClick={() => onSave({ name, emoji, color, currency, kind, initialCents })}
        >
          {account ? 'Guardar cambios' : isPerson ? 'Crear persona' : 'Crear cuenta'}
        </button>

        {account && onArchive && balance === 0 && (
          <button className="btn btn--ghost btn--block" onClick={onArchive}>
            🗄️ Archivar cuenta
          </button>
        )}
        {account && onArchive && balance !== 0 && (
          <p className="screen-sub" style={{ textAlign: 'center', margin: '2px 0' }}>
            Para archivar, deja la cuenta en <b>0</b>.
          </p>
        )}
        {account && onDelete && (
          <button className="btn btn--ghost btn--block" onClick={onDelete}>
            🗑️ Eliminar cuenta
          </button>
        )}
      </div>
    </Sheet>
  )
}

function hexTint(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return 'var(--primary-tint)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.18)`
}
