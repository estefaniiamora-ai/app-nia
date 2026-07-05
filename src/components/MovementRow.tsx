import { useApp } from '../store/store'
import Money from './Money'
import { relativeDay, formatTime } from '../lib/date'
import { accountCurrency, transferInAmount, type Movement } from '../data/types'

interface Props {
  movement: Movement
  onClick?: (m: Movement) => void
}

export default function MovementRow({ movement: m, onClick }: Props) {
  const { accounts, categories } = useApp()
  const account = accounts.find((a) => a.id === m.accountId)
  const toAccount = m.toAccountId ? accounts.find((a) => a.id === m.toAccountId) : undefined
  const category = m.categoryId ? categories.find((c) => c.id === m.categoryId) : undefined

  let emoji = '🔁'
  let title = 'Transferencia'
  if (m.type === 'income' || m.type === 'expense') {
    emoji = category?.emoji ?? (m.type === 'income' ? '💚' : '🛍️')
    title = category?.name ?? (m.type === 'income' ? 'Ingreso' : 'Gasto')
  } else if (m.type === 'adjust') {
    emoji = '⚖️'
    title = 'Ajuste de saldo'
  }

  const srcCur = account ? accountCurrency(account) : 'COP'
  const dstCur = toAccount ? accountCurrency(toAccount) : 'COP'
  const isCross = m.type === 'transfer' && !!toAccount && srcCur !== dstCur

  let sub = account?.name ?? '—'
  if (m.type === 'transfer' && toAccount) sub = `${account?.name ?? '—'} → ${toAccount.name}`
  if (m.note) sub = m.note

  const signed =
    m.type === 'income'
      ? m.amount
      : m.type === 'expense'
        ? -m.amount
        : m.type === 'adjust'
          ? m.direction === 'out'
            ? -m.amount
            : m.amount
          : 0

  return (
    <button className="row" onClick={() => onClick?.(m)} style={{ width: '100%', textAlign: 'left' }}>
      <span className="row__icon" style={category ? { background: hexTint(category.color) } : undefined}>
        {emoji}
      </span>
      <span className="row__main">
        <span className="row__title">
          {title}
          {m.pending && <span className="pending-pill">⏳ pendiente</span>}
        </span>
        <span className="row__sub">
          {relativeDay(m.date)} · {formatTime(m.date)}
          {sub ? ` · ${sub}` : ''}
        </span>
      </span>
      <span className="row__right">
        {m.type === 'transfer' ? (
          <span style={{ color: 'var(--transfer)' }}>
            <Money value={m.amount} currency={srcCur} />
            {isCross && (
              <>
                {' → '}
                <Money value={transferInAmount(m)} currency={dstCur} />
              </>
            )}
          </span>
        ) : (
          <Money value={signed} currency={srcCur} colored showPlus={m.type === 'income'} />
        )}
      </span>
    </button>
  )
}

/** Convierte un hex en un tinte translúcido para el fondo del ícono. */
function hexTint(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return 'var(--primary-tint)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.18)`
}
