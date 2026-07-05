import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from './ui/Sheet'
import Money from './Money'
import { duePopupReminders, reminderStatus } from '../data/reminders'
import { accountCurrency } from '../data/types'
import './PaymentsDuePopup.css'

/**
 * Popup que se asoma al entrar y recuerda los pagos que urgen:
 * atrasados, de hoy y de mañana. Cada uno se puede marcar "ya lo pagué"
 * ahí mismo; al pagarlo desaparece de la lista. Cuando no queda ninguno,
 * muestra un mensajito de "todo al día".
 */
export default function PaymentsDuePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reminders, accounts, markReminderPaid } = useApp()
  const navigate = useNavigate()

  const due = useMemo(() => duePopupReminders(reminders), [reminders])

  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name

  return (
    <Sheet open={open} onClose={onClose} title="Pagos pendientes 🔔">
      {due.length === 0 ? (
        <div className="paydue__done">
          <span className="paydue__done-ic">🎉</span>
          <p className="paydue__done-title">¡Todo al día!</p>
          <p className="paydue__done-sub">No te queda nada urgente por pagar 💕</p>
          <button className="btn btn--primary btn--block" onClick={onClose}>
            Listo
          </button>
        </div>
      ) : (
        <>
          <p className="paydue__intro">Esto es lo que tienes por pagar 💸</p>

          <div className="list">
            {due.map((r) => {
              const st = reminderStatus(r)
              const acc = accounts.find((a) => a.id === r.accountId)
              return (
                <div key={r.id} className="row paydue__row">
                  <span className="row__icon">{r.emoji || '🔔'}</span>
                  <span className="row__main">
                    <span className="row__title">{r.name}</span>
                    <span className="row__sub">
                      <span className={`paydue__pill paydue__pill--${st.state}`}>{st.label}</span>
                      {r.amount ? (
                        <>
                          {' · '}
                          <Money value={r.amount} currency={acc ? accountCurrency(acc) : 'COP'} />
                        </>
                      ) : (
                        ''
                      )}
                      {accName(r.accountId) ? ` · ${accName(r.accountId)}` : ''}
                    </span>
                  </span>
                  <button
                    className="paydue__pay tap"
                    title="Marcar como pagado"
                    onClick={() => markReminderPaid(r.id)}
                  >
                    Pagué ✓
                  </button>
                </div>
              )
            })}
          </div>

          <div className="paydue__actions">
            <button
              className="btn btn--ghost"
              onClick={() => {
                onClose()
                navigate('/cuentas')
              }}
            >
              Ver en Cuentas
            </button>
            <button className="btn btn--primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
