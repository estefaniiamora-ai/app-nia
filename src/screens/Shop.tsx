import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Cat from '../components/Cat/Cat'
import CatStage from '../components/Cat/CatStage'
import Sheet from '../components/ui/Sheet'
import {
  SHOP_ITEMS,
  FREE_DEFAULTS,
  isUnlocked,
  inSeason,
  effectiveLook,
  unlocksInDays,
  mundialDaysLeft,
  type ItemKind,
  type ShopItem,
} from '../data/shop'
import './Shop.css'

type TabKey = ItemKind | 'mundial'

const TABS: { kind: TabKey; label: string; emoji: string }[] = [
  { kind: 'accessory', label: 'Accesorios', emoji: '🎀' },
  { kind: 'mundial', label: 'Mundial', emoji: '⚽' },
  { kind: 'skin', label: 'Skins', emoji: '🐱' },
  { kind: 'background', label: 'Fondos', emoji: '🖼️' },
]

const MES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function Shop() {
  const { profile, updateProfile, gamification, goalsMet, toggleEquip, selectSkin, selectBackground } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('accessory')
  const [preview, setPreview] = useState<ShopItem | null>(null)
  const month = new Date().getMonth() + 1
  const best = gamification.bestStreak ?? 0
  const look = effectiveLook(gamification, month, goalsMet)
  const daysLeft = mundialDaysLeft()

  const items = useMemo(
    () =>
      SHOP_ITEMS.filter((i) =>
        tab === 'mundial'
          ? i.event === 'mundial'
          : i.kind === tab && !i.event && i.unlockGoal == null,
      ),
    [tab],
  )

  function unlocked(item: ShopItem) {
    return isUnlocked(item, gamification, month, undefined, goalsMet)
  }
  function active(item: ShopItem) {
    if (item.kind === 'accessory') return gamification.equipped.includes(item.id)
    if (item.kind === 'skin') return gamification.skin === item.id
    return gamification.background === item.id
  }

  function statusLabel(item: ShopItem): { text: string; cls: string } {
    if (item.event === 'mundial' && !unlocked(item)) {
      const d = unlocksInDays(item)
      return { text: d <= 1 ? '🔒 mañana' : `🔒 en ${d} días`, cls: 'locked' }
    }
    if (!inSeason(item, month)) return { text: `🎄 ${MES[item.seasonal![0]]}`, cls: 'locked' }
    if (!unlocked(item)) return { text: `🔒 ${item.unlockStreak} días`, cls: 'locked' }
    if (active(item)) return { text: '✓ puesto', cls: 'on' }
    return { text: 'tocar', cls: 'have' }
  }

  return (
    <main className="screen shop">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Mi Gatito 🐱</h1>
          <p className="screen-sub">Vístelo, ponle nombre y más 🎀</p>
        </div>
        <span className="streakpill" title="Racha máxima">
          🔥 <b>{best}</b>
        </span>
      </div>

      {/* Vista previa del outfit actual (solo lo desbloqueado) */}
      <div className="shop-preview">
        <CatStage background={look.background} size={190}>
          <Cat size={150} equipped={look.equipped} skin={look.skin} alive />
        </CatStage>
      </div>

      {/* Nombre del gato (editable) */}
      <div className="cat-name">
        <input
          className="cat-name__input"
          value={profile.catName}
          onChange={(e) => updateProfile({ catName: e.target.value })}
          placeholder="Michi"
          maxLength={20}
          aria-label="Nombre del gato"
        />
        <span className="cat-name__pencil">✏️</span>
      </div>

      {/* Píldora de racha */}
      <div className="cat-stats">
        <span className="cat-stat">🔥 <b>{best}</b> racha</span>
      </div>

      {/* Pestañas */}
      <div className="rowflex" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.kind}
            className={`chip ${tab === t.kind ? 'chip--active' : ''}`}
            onClick={() => setTab(t.kind)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Aviso del Mundial (tiempo limitado) */}
      {tab === 'mundial' && (
        <div className="mundial-banner">
          {daysLeft > 0 ? (
            <>⚽ ¡Se desbloquea uno por día! El Mundial acaba en <b>{daysLeft}</b> {daysLeft === 1 ? 'día' : 'días'} ⏳</>
          ) : (
            <>⚽ ¡Colección del Mundial completa! Es tuya para siempre 🏆</>
          )}
        </div>
      )}

      {/* Grid de ítems */}
      <div className="shopgrid">
        {items.map((item) => {
          const st = statusLabel(item)
          return (
            <button key={item.id} className={`shopitem shopitem--${st.cls}`} onClick={() => setPreview(item)}>
              <span className="shopitem__emoji">{item.emoji}</span>
              <span className="shopitem__name">{item.name}</span>
              <span className={`shopitem__status status--${st.cls}`}>{st.text}</span>
            </button>
          )
        })}
      </div>

      <p className="shop-foot">
        {tab === 'mundial'
          ? 'Entra cada día del Mundial y ve completando la colección. ¡Lo que desbloqueas queda tuyo para siempre! ⚽'
          : 'Cada día que entras sube tu racha 🔥 y desbloqueas cosas nuevas para tu michi. ¡Y quedan tuyas para siempre!'}
      </p>

      {/* Teaser: mini-juegos (próximamente) */}
      <div className="minigames-teaser">
        <span className="minigames-teaser__ic">🎮</span>
        <span className="grow">
          <b>Mini-juegos con tu michi</b>
          <span className="minigames-teaser__sub">Jugar, darle premios y más 🐾</span>
        </span>
        <span className="soon-pill">Pronto ✨</span>
      </div>

      <PreviewSheet
        item={preview}
        gamification={gamification}
        goalsMet={goalsMet}
        month={month}
        onClose={() => setPreview(null)}
        onToggleAccessory={(id) => toggleEquip(id)}
        onSelectSkin={(id) => selectSkin(id)}
        onSelectBackground={(id) => selectBackground(id)}
      />
    </main>
  )
}

/* ---------- Hoja de vista previa + confirmación ---------- */
function PreviewSheet({
  item,
  gamification,
  goalsMet,
  month,
  onClose,
  onToggleAccessory,
  onSelectSkin,
  onSelectBackground,
}: {
  item: ShopItem | null
  gamification: ReturnType<typeof useApp>['gamification']
  goalsMet: number
  month: number
  onClose: () => void
  onToggleAccessory: (id: string) => void
  onSelectSkin: (id: string) => void
  onSelectBackground: (id: string) => void
}) {
  const open = !!item
  const unlocked = item
    ? FREE_DEFAULTS.includes(item.id) || isUnlocked(item, gamification, month, undefined, goalsMet)
    : false
  const best = gamification.bestStreak ?? 0

  // outfit base = solo lo desbloqueado, + el ítem que se está viendo
  const base = effectiveLook(gamification, month, goalsMet)
  const equipped = item
    ? item.kind === 'accessory'
      ? Array.from(new Set([...base.equipped, item.id]))
      : base.equipped
    : base.equipped
  const skin = item && item.kind === 'skin' ? item.id : base.skin
  const background = item && item.kind === 'background' ? item.id : base.background

  const isActive =
    item &&
    (item.kind === 'accessory'
      ? gamification.equipped.includes(item.id)
      : item.kind === 'skin'
        ? gamification.skin === item.id
        : gamification.background === item.id)

  function action() {
    if (!item) return
    if (item.kind === 'accessory') onToggleAccessory(item.id)
    else if (item.kind === 'skin') onSelectSkin(item.id)
    else onSelectBackground(item.id)
  }

  return (
    <Sheet open={open} onClose={onClose} title={item ? `${item.emoji} ${item.name}` : undefined}>
      {item && (
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          {/* SIEMPRE muestra cómo se vería con el ítem puesto (aunque esté bloqueado) */}
          <CatStage background={background} size={188}>
            <Cat size={150} equipped={equipped} skin={skin} alive />
          </CatStage>

          {unlocked ? (
            <>
              <p className="screen-sub">Así se le ve a tu michi 🐱</p>
              <button
                className={`btn ${isActive ? 'btn--ghost' : 'btn--primary'} btn--block`}
                onClick={() => {
                  action()
                  if (!isActive && item.kind !== 'accessory') onClose()
                }}
              >
                {item.kind === 'accessory'
                  ? isActive
                    ? 'Quitar'
                    : 'Ponérselo'
                  : isActive
                    ? '✓ En uso'
                    : 'Usar este'}
              </button>
            </>
          ) : item.event === 'mundial' ? (
            <div className="preview-locked">
              <p className="screen-sub">👀 Así se le vería… ¡ya casi!</p>
              <div className="preview-locked__big">⚽</div>
              <p>
                Se desbloquea{' '}
                {unlocksInDays(item) <= 1 ? <b>mañana</b> : <>en <b>{unlocksInDays(item)} días</b></>} 🔥
              </p>
              <p className="screen-sub">
                Entra cada día del Mundial y ve completando la colección. ¡Corre, que el Mundial se acaba! ⏳
              </p>
            </div>
          ) : (
            <div className="preview-locked">
              <p className="screen-sub">👀 Así se le vería… ¡desbloquéalo!</p>
              <div className="preview-locked__big">🔒</div>
              <p>
                Se desbloquea con una racha de <b>{item.unlockStreak} días</b> 🔥
              </p>
              <p className="screen-sub">
                Tu mejor racha es de <b>{best}</b> {best === 1 ? 'día' : 'días'}. ¡Te faltan{' '}
                <b>{Math.max(0, item.unlockStreak - best)}</b>! Entra cada día para lograrlo 💪
              </p>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
