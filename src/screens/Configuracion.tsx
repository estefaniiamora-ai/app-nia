import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import { useAuth } from '../firebase/AuthProvider'
import type { ThemePref } from '../data/types'

const THEMES: { value: ThemePref; label: string; emoji: string }[] = [
  { value: 'light', label: 'Claro', emoji: '☀️' },
  { value: 'dark', label: 'Oscuro', emoji: '🌙' },
  { value: 'system', label: 'Auto', emoji: '🪄' },
]

export default function Configuracion() {
  const { profile, updateProfile, gamification } = useApp()
  const { user, signOutUser } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="screen">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Ajustes ⚙️</h1>
          <p className="screen-sub">Tu app, a tu manera</p>
        </div>
      </div>

      {/* Tema */}
      <section className="card stack">
        <p className="t-label">Apariencia</p>
        <div className="rowflex" style={{ gap: 8 }}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              className={`chip ${profile.theme === t.value ? 'chip--active' : ''}`}
              onClick={() => updateProfile({ theme: t.value })}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Racha */}
      <section className="card spread">
        <span className="grow">
          <b style={{ fontSize: 14 }}>Tu racha 🔥</b>
          <p className="screen-sub">
            Actual: {gamification.streak} {gamification.streak === 1 ? 'día' : 'días'} · récord:{' '}
            {gamification.bestStreak ?? 0}
          </p>
        </span>
        <span className="streakpill">🔥 <b>{gamification.streak}</b></span>
      </section>

      {/* Cuenta */}
      <section className="card stack">
        <p className="t-label">Cuenta</p>
        {user?.email && (
          <p className="screen-sub" style={{ marginBottom: 4 }}>
            Sesión iniciada como <b>{user.email}</b>. Tus datos se guardan de forma privada.
          </p>
        )}
        <button
          className="btn btn--ghost btn--block"
          onClick={() => {
            if (confirm('¿Cerrar sesión? Podrás volver a entrar con tu cuenta de Google.')) {
              signOutUser()
            }
          }}
        >
          🚪 Cerrar sesión
        </button>
      </section>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
        Nia App · hecha con 💗
      </p>
    </main>
  )
}
