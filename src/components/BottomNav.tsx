import { NavLink, useLocation } from 'react-router-dom'
import './BottomNav.css'

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/movimientos', icon: '📜', label: 'Movimientos' },
  { to: '/cuentas', icon: '💳', label: 'Cuentas' },
  { to: '/ajustes', icon: '💗', label: 'Más' },
]

/** Atajos que solo caben en el menú lateral del computador. */
const ITEMS_PC = [
  { to: '/gym', icon: '💪', label: 'Mi Gym' },
  { to: '/comida', icon: '🥗', label: 'Mi Comida' },
]

export default function BottomNav() {
  const loc = useLocation()
  return (
    <nav className="bottomnav">
      <div className="bottomnav__bar">
        <NavItem item={ITEMS[0]} active={loc.pathname === '/'} />
        <NavItem item={ITEMS[1]} active={loc.pathname.startsWith('/movimientos')} />
        {/* hueco central donde flota el botón + (que vive en su propia capa) */}
        <div className="fab-slot" aria-hidden="true" />
        <NavItem item={ITEMS[2]} active={loc.pathname.startsWith('/cuentas')} />
        <NavItem item={ITEMS[3]} active={loc.pathname.startsWith('/ajustes')} />
        {ITEMS_PC.map((it) => (
          <NavItem key={it.to} item={it} active={loc.pathname.startsWith(it.to)} soloPC />
        ))}
      </div>
    </nav>
  )
}

/** Botón central +. Vive en su PROPIA capa (z-index alto) para quedar por
 *  encima del gatito que pasea sobre la barra. */
export function Fab({ onClick, open = false }: { onClick: () => void; open?: boolean }) {
  return (
    <button
      className={`fab ${open ? 'fab--open' : ''}`}
      onClick={onClick}
      aria-label="Registrar movimiento"
    >
      <span className="fab__plus">+</span>
    </button>
  )
}

function NavItem({
  item,
  active,
  soloPC = false,
}: {
  item: { to: string; icon: string; label: string }
  active: boolean
  /** solo se ve en el menú lateral del computador */
  soloPC?: boolean
}) {
  return (
    <NavLink
      to={item.to}
      className={`navitem ${active ? 'navitem--active' : ''} ${soloPC ? 'navitem--pc' : ''}`}
    >
      <span className="navitem__icon">{item.icon}</span>
      <span className="navitem__label">{item.label}</span>
    </NavLink>
  )
}
