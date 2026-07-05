import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'

export default function Settings() {
  const { gamification } = useApp()
  const navigate = useNavigate()

  const rows: { icon: string; title: string; sub: string; to: string; pill?: boolean }[] = [
    { icon: '🐱', title: 'Mi Gatito', sub: 'Vístelo, ponle nombre y más 🎀', to: '/tienda', pill: true },
    { icon: '🎀', title: 'Notitas', sub: 'Tus ideas, listas y recados 💭', to: '/notas' },
    { icon: '🌙', title: 'Mi Ciclo', sub: 'Tu calendario íntimo y privado 🌙', to: '/ciclo' },
    { icon: '📊', title: 'Estadísticas', sub: 'En qué entra y sale tu plata', to: '/estadisticas' },
    { icon: '⚙️', title: 'Ajustes', sub: 'Apariencia, cuenta y más', to: '/configuracion' },
  ]

  return (
    <main className="screen">
      <div className="screen-head">
        <div>
          <h1>Más 💜</h1>
          <p className="screen-sub">Todo tu michi-mundo en un lugar</p>
        </div>
      </div>

      <div className="list">
        {rows.map((r) => (
          <button
            key={r.to}
            className="row"
            onClick={() => navigate(r.to)}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <span className="row__icon">{r.icon}</span>
            <span className="row__main">
              <span className="row__title">{r.title}</span>
              <span className="row__sub">{r.sub}</span>
            </span>
            {r.pill ? (
              <span className="streakpill">🔥 <b>{gamification.bestStreak ?? 0}</b></span>
            ) : (
              <span className="row__right">›</span>
            )}
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
        Nia App · hecha con 💗
      </p>
    </main>
  )
}
