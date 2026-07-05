import { useState } from 'react'
import { useApp } from '../store/store'
import Cat from '../components/Cat/Cat'
import { parseAmountToCents } from '../lib/money'
import { lastEmoji } from '../lib/emoji'
import { PALETTE } from '../data/seed'
import Money from '../components/Money'
import './Onboarding.css'

const EMOJIS = ['💵', '📱', '🏦', '🐷', '💳', '👛']

export default function Onboarding() {
  const { updateProfile, addAccount, addMovement } = useApp()
  const [step, setStep] = useState(0)
  const [catName, setCatName] = useState('')
  const [accName, setAccName] = useState('')
  const [accEmoji, setAccEmoji] = useState('💵')
  const [balRaw, setBalRaw] = useState('')

  function finish() {
    const acc = addAccount({
      name: accName.trim() || 'Efectivo',
      emoji: accEmoji,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    })
    const cents = parseAmountToCents(balRaw)
    if (cents > 0) {
      addMovement({ type: 'adjust', amount: cents, accountId: acc.id, direction: 'in', note: 'Saldo inicial' })
    }
    updateProfile({ catName: catName.trim() || 'Michi', onboarded: true })
  }

  return (
    <div className="onb">
      <div className="onb__card">
        {step === 0 && (
          <>
            <Cat size={150} mood="celebrate" alive={false} speech="¡Holaaa! 💜" />
            <h1 className="onb__title">¡Bienvenida a Nia! 💗</h1>
            <p className="onb__text">
              Soy tu gatito y te voy a acompañar a llevar tus cuentas, bonitas y al día.
              <br />
              ¿Cómo me quieres llamar?
            </p>
            <input
              className="input onb__input"
              placeholder="Michi"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              maxLength={16}
              autoFocus
            />
            <button className="btn btn--primary btn--block" onClick={() => setStep(1)}>
              Continuar
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <Cat size={120} mood="happy" alive={false} speech={catName.trim() ? `¡${catName.trim()}! 🐾` : undefined} />
            <h1 className="onb__title">Tu primera cuenta 💳</h1>
            <p className="onb__text">
              ¿Dónde tienes plata ahorita? Crea tu primera cuenta. Luego puedes agregar más.
            </p>

            <div className="field">
              <label>Nombre</label>
              <input
                className="input"
                placeholder="Ej: Nequi, Efectivo…"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label>Emoji</label>
              <div className="rowflex" style={{ gap: 8 }}>
                <input
                  className="input emoji-input"
                  value={accEmoji}
                  onChange={(e) => setAccEmoji(lastEmoji(e.target.value))}
                  placeholder="😺"
                  aria-label="Emoji de la cuenta"
                />
                <div className="chips-scroll no-scrollbar">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      className={`emoji-chip ${accEmoji === e ? 'emoji-chip--on' : ''}`}
                      onClick={() => setAccEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field">
              <label>¿Cuánto tienes ahí ahora? (opcional)</label>
              <input
                className="input"
                inputMode="decimal"
                placeholder="0"
                value={balRaw}
                onChange={(e) => setBalRaw(e.target.value)}
              />
              {parseAmountToCents(balRaw) > 0 && (
                <p className="onb__hint">
                  Saldo inicial: <Money value={parseAmountToCents(balRaw)} /> (no cuenta como ingreso)
                </p>
              )}
            </div>

            <button className="btn btn--primary btn--block" onClick={finish}>
              ¡Empezar! 💜
            </button>
            <button className="btn btn--ghost btn--block" onClick={finish}>
              Saltar por ahora
            </button>
          </>
        )}
      </div>
    </div>
  )
}
