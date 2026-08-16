import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../store/store'
import Cat, { type CatMood } from '../components/Cat/Cat'
import CatStage from '../components/Cat/CatStage'
import DraggableCat from '../components/DraggableCat'
import { BUDDY_SPRING } from '../components/BuddyCat'
import Money from '../components/Money'
import MovementRow from '../components/MovementRow'
import { useSheets } from '../components/SheetsContext'
import { effectiveLook } from '../data/shop'
import { totalsByCurrency, pendingTransfers, sortedDesc } from '../data/selectors'
import { accountCurrency, isPersonAccount } from '../data/types'
import { pendingCount, duePopupReminders } from '../data/reminders'
import { localDayKey, daysBetween } from '../lib/date'
import { cycleStatus, checkInOptions, checkInTitle, phaseCat, type CheckInOption } from '../lib/cycle'
import CycleDaySheet from '../components/CycleDaySheet'
import PeekCat from '../components/PeekCat'
import PaymentsDuePopup from '../components/PaymentsDuePopup'
import HaalandBanner from '../components/HaalandBanner'
import './Home.css'

/** Una vez por sesión (se reinicia al recargar la app): que el popup de
 *  pagos pendientes se asome solo la primera vez que se llega a Inicio. */
let duePopupShownThisSession = false

/** Frasecitas que el gato rota mientras espera que completes la racha
 *  (tiernas y con un poquito de presión cariñosa). */
const AWAIT_PHRASES = [
  '¡tócame! 🔥',
  'no has completado tu racha 👀',
  '¿me tocas hoy? 🥺',
  'no me olvides 💗',
  'un toquecito y ya 🐾',
  '¿cómo vas hoy? 🌙',
  'aquí te espero… 💗',
  '¿ya? ¿ya? 🔥',
]

export default function Home() {
  const { profile, accounts, movements, gamification, goalsMet, reminders, notes, cycle, workouts, foodLogs, lessons, englishTasks, claimDaily, claimReward, markBled, updateProfile } = useApp()
  const { openAdd, addOpen } = useSheets()
  const navigate = useNavigate()
  const [mood, setMood] = useState<CatMood>('idle')
  const [toast, setToast] = useState<string | null>(null)
  const [showDuePopup, setShowDuePopup] = useState(false)
  const [cycleSheet, setCycleSheet] = useState<string | null>(null)
  const [streakChooser, setStreakChooser] = useState(false)
  // Banner de la camiseta de Haaland: se ve en cada entrada hasta reclamarla.
  // "Saltar" solo lo cierra por esta sesión (al recargar vuelve a asomarse).
  const haalandClaimed = gamification.claims?.includes('haaland') ?? false
  const [haalandSkip, setHaalandSkip] = useState(false)

  const totals = useMemo(() => totalsByCurrency(accounts, movements), [accounts, movements])
  const hasUSD = useMemo(
    () => accounts.some((a) => !a.archived && accountCurrency(a) === 'USD'),
    [accounts],
  )
  const pendings = useMemo(() => pendingTransfers(movements), [movements])
  const realCount = useMemo(
    () => accounts.filter((a) => !a.archived && !a.deleted && !isPersonAccount(a)).length,
    [accounts],
  )
  const remPending = useMemo(() => pendingCount(reminders), [reminders])
  const dueNow = useMemo(() => duePopupReminders(reminders).length, [reminders])
  const recent = useMemo(() => sortedDesc(movements).slice(0, 4), [movements])
  const look = useMemo(
    () => effectiveLook(gamification, new Date().getMonth() + 1, goalsMet),
    [gamification, goalsMet],
  )
  const today = localDayKey()
  const claimedToday = gamification.lastClaimDate === today
  const cycleStat = useMemo(() => cycleStatus(cycle), [cycle])
  const phaseMood = phaseCat(cycleStat.phase?.type ?? null).mood as CatMood

  // Resumen rápido del gym (entrenos de los últimos 7 días) y de la comida de hoy
  const entrenosSemana = useMemo(() => {
    const hoy = localDayKey()
    return workouts.filter((w) => {
      const d = daysBetween(w.date, hoy)
      return d >= 0 && d < 7
    }).length
  }, [workouts])

  const kcalHoy = useMemo(() => {
    const hoy = localDayKey()
    return foodLogs.filter((f) => f.date === hoy).reduce((n, f) => n + f.kcal, 0)
  }, [foodLogs])

  // Tareas de inglés que faltan por hacer
  const tareasIngles = useMemo(() => englishTasks.filter((t) => !t.done).length, [englishTasks])

  // Lo que le falta anotar hoy (según los recordatorios que ella activó).
  // Así, aunque no le llegue la notificación, al abrir la app lo ve.
  const pendientesHoy = useMemo(() => {
    const prefs = profile.notif
    if (!prefs?.enabled) return []
    const hoy = localDayKey()
    const faltan: { emoji: string; label: string; to: string }[] = []
    if (prefs.times?.gym && !workouts.some((w) => w.date === hoy))
      faltan.push({ emoji: '💪', label: 'tu entreno', to: '/gym' })
    if (prefs.times?.comida && !foodLogs.some((f) => f.date === hoy))
      faltan.push({ emoji: '🥗', label: 'tu comida', to: '/comida' })
    if (prefs.times?.cuentas && !movements.some((m) => localDayKey(m.date) === hoy))
      faltan.push({ emoji: '💸', label: 'tus cuentas', to: '/movimientos' })
    if (
      prefs.times?.ingles &&
      !lessons.some((l) => l.date === hoy) &&
      !englishTasks.some((t) => t.doneAt && localDayKey(t.doneAt) === hoy)
    )
      faltan.push({ emoji: '📚', label: 'tu inglés', to: '/ingles' })
    return faltan
  }, [profile.notif, workouts, foodLogs, movements, lessons, englishTasks])

  // El gatito descansa según la fase (mimoso en la regla, radiante en ovulación…)
  useEffect(() => {
    setMood(phaseMood)
  }, [phaseMood])

  // Mientras no completes la racha, el gato rota frasecitas cada ratico
  const [awaitIdx, setAwaitIdx] = useState(0)
  useEffect(() => {
    if (claimedToday) return
    const t = window.setInterval(() => setAwaitIdx((i) => (i + 1) % AWAIT_PHRASES.length), 3600)
    return () => window.clearInterval(t)
  }, [claimedToday])

  // Al llegar a Inicio por primera vez en la sesión, si hay pagos atrasados,
  // de hoy o de mañana, asomamos el popup una sola vez.
  useEffect(() => {
    if (!duePopupShownThisSession && dueNow > 0) {
      duePopupShownThisSession = true
      setShowDuePopup(true)
    }
  }, [dueNow])

  function flashToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  function onCheckIn(opt: CheckInOption) {
    markBled(today, opt.bled)
    // Si marcó que le llegó (o sigue), abre el mini-cuestionario del día
    // para no tener que registrarlo dos veces. Puede dejarlo vacío.
    if (opt.bled) setCycleSheet(today)
    const r = claimDaily()
    setMood('celebrate')
    if (r.already) {
      flashToast(opt.bled ? 'Anotado, cuídate 🌙' : 'Anotado 💗')
    } else if (r.unlocked.length) {
      flashToast(`🔥 ¡Racha de ${r.streak}! Desbloqueaste: ${r.unlocked.join(', ')} 🎉`)
    } else {
      flashToast(`🔥 ¡Racha de ${r.streak} ${r.streak === 1 ? 'día' : 'días'}! 💗`)
    }
    window.setTimeout(() => setMood(phaseMood), 1800)
  }

  return (
    <main className="screen home">
      {/* Saludo + monedas */}
      <header className="home__top">
        <div>
          <p className="home__hi">¡Hola, {profile.userName}! 💗</p>
          <p className="screen-sub">Tus cuentas, bonitas y al día</p>
        </div>
        <button className="streakpill tap" title="Tienda y racha" onClick={() => navigate('/tienda')}>
          🔥 <b>{gamification.streak}</b>
        </button>
      </header>

      {/* Tarjeta de saldo + gato */}
      <section className="balancecard">
        {/* mientras el popup de la racha está abierto se esconde ESTE gato,
            para que solo se vea el asomado (nunca dos gatos a la vez) */}
        <div
          className="balancecard__cat"
          style={{ opacity: streakChooser || addOpen ? 0 : 1, transition: 'opacity 0.15s ease' }}
        >
          <CatStage background={look.background} size={168}>
            <motion.div
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={BUDDY_SPRING}
            >
              <DraggableCat>
                <Cat
                  size={132}
                  mood={mood}
                  equipped={look.equipped}
                  skin={look.skin}
                  awaiting={!claimedToday}
                  speech={!claimedToday ? AWAIT_PHRASES[awaitIdx] : null}
                  onTap={() => { if (!claimedToday) setStreakChooser(true) }}
                />
              </DraggableCat>
            </motion.div>
          </CatStage>
        </div>
        <div className="balancecard__label">
          <span>Saldo total</span>
          <button
            className="eyebtn"
            onClick={() => updateProfile({ hideBalance: !profile.hideBalance })}
            aria-label="Ocultar saldo"
          >
            {profile.hideBalance ? '🙈' : '👁️'}
          </button>
        </div>
        <div className="balancecard__amount">
          <Money value={totals.COP} currency="COP" hidden={profile.hideBalance} />
        </div>
        {hasUSD && (
          <div className="balancecard__amount2">
            <Money value={totals.USD} currency="USD" hidden={profile.hideBalance} />
          </div>
        )}
        <p className="balancecard__sub">
          {realCount} cuenta{realCount === 1 ? '' : 's'} activa{realCount === 1 ? '' : 's'}
          {hasUSD ? ' · pesos y dólares por separado' : ''}
        </p>
      </section>


      {/* Transferencias en camino (pendientes de confirmar) */}
      {pendings.length > 0 && (
        <button className="pendingcard" onClick={() => navigate('/movimientos')}>
          <span className="pendingcard__ic">⏳</span>
          <span className="grow">
            <b>
              {pendings.length} {pendings.length === 1 ? 'transferencia en camino' : 'transferencias en camino'}
            </b>
            <span className="dailycard__sub">Confírmalas cuando el dinero llegue de verdad 💸</span>
          </span>
          <span className="pendingcard__cta">Ver</span>
        </button>
      )}

      {/* Recordatorios de pago pendientes */}
      {remPending > 0 && (
        <button className="pendingcard" onClick={() => navigate('/cuentas')}>
          <span className="pendingcard__ic">🔔</span>
          <span className="grow">
            <b>{remPending} {remPending === 1 ? 'pago por hacer' : 'pagos por hacer'}</b>
            <span className="dailycard__sub">Revisa tus recordatorios en Cuentas 🗓️</span>
          </span>
          <span className="pendingcard__cta">Ver</span>
        </button>
      )}

      {/* Acceso a Notitas */}
      <button className="tokentile notestile" onClick={() => navigate('/notas')}>
        <span className="tokentile__ic">🎀</span>
        <span className="grow">
          <b>Notitas</b>
          <span className="tokentile__sub">
            {notes.length > 0
              ? `${notes.length} ${notes.length === 1 ? 'notita guardada' : 'notitas guardadas'} 💭`
              : 'Anota ideas, listas y recados 💭'}
          </span>
        </span>
        <span className="tokentile__cta">›</span>
      </button>

      {/* Lo que falta anotar hoy */}
      {pendientesHoy.length > 0 && (
        <div className="pendhoy">
          <div className="pendhoy__top">
            <span className="pendhoy__ic">🔔</span>
            <b>Te falta anotar hoy</b>
          </div>
          <div className="pendhoy__chips">
            {pendientesHoy.map((p) => (
              <button key={p.to} className="chip" onClick={() => navigate(p.to)}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Acceso a Mi Gym */}
      <button className="tokentile gymtile" onClick={() => navigate('/gym')}>
        <span className="tokentile__ic">💪</span>
        <span className="grow">
          <b>Mi Gym</b>
          <span className="tokentile__sub">
            {entrenosSemana > 0
              ? `${entrenosSemana} ${entrenosSemana === 1 ? 'entreno' : 'entrenos'} esta semana 🔥`
              : 'Registra tu entreno de hoy 🏋️‍♀️'}
          </span>
        </span>
        <span className="tokentile__cta">›</span>
      </button>

      {/* Acceso a Mi Comida */}
      <button className="tokentile foodtile" onClick={() => navigate('/comida')}>
        <span className="tokentile__ic">🥗</span>
        <span className="grow">
          <b>Mi Comida</b>
          <span className="tokentile__sub">
            {kcalHoy > 0
              ? `${kcalHoy.toLocaleString('es-CO')} kcal hoy 🍓`
              : 'Anota lo que comes y sus nutrientes 🍓'}
          </span>
        </span>
        <span className="tokentile__cta">›</span>
      </button>

      {/* Acceso a Mi Inglés */}
      <button className="tokentile engtile" onClick={() => navigate('/ingles')}>
        <span className="tokentile__ic">📚</span>
        <span className="grow">
          <b>Mi Inglés</b>
          <span className="tokentile__sub">
            {tareasIngles > 0
              ? `${tareasIngles} ${tareasIngles === 1 ? 'tarea pendiente' : 'tareas pendientes'} ✏️`
              : 'Tus clases, tareas y palabras nuevas 🔤'}
          </span>
        </span>
        <span className="tokentile__cta">›</span>
      </button>

      {/* Movimientos recientes */}
      <section className="stack">
        <div className="spread">
          <h2 className="t-title">Recientes</h2>
          {movements.length > 0 && (
            <Link to="/movimientos" className="home__link">
              Ver todo ›
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="card empty">
            <h3>Todo empieza aquí ✨</h3>
            <p>
              Toca el botón <b>＋</b> de abajo para registrar tu primer movimiento.
              {accounts.length === 0 && (
                <>
                  {' '}
                  Primero crea una cuenta en <Link to="/cuentas" className="home__link">Cuentas</Link>.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="list">
            {recent.map((m) => (
              <MovementRow key={m.id} movement={m} onClick={openAdd} />
            ))}
          </div>
        )}
      </section>

      {toast && <div className="toast-pop">{toast}</div>}

      {/* El gato pide la racha: al tocarlo, elige si te llegó o no */}
      {streakChooser && (
        <div className="streakpop" onClick={() => setStreakChooser(false)}>
          <div className="streakpop__wrap" onClick={(e) => e.stopPropagation()}>
            <PeekCat />
            <div className="streakpop__card">
              <b className="streakpop__title">{checkInTitle(cycle, today)}</b>
              <span className="streakpop__sub">Un toque suma tu racha · solo tú lo ves 💗</span>
              <div className="streakpop__opts">
                {checkInOptions(cycleStat, today, cycle).map((o) => (
                  <button
                    key={o.id}
                    className={`chk ${o.tone === 'moon' ? 'chk--moon' : o.tone === 'done' ? 'chk--done' : ''}`}
                    onClick={() => {
                      onCheckIn(o)
                      setStreakChooser(false)
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {cycleSheet && <CycleDaySheet date={cycleSheet} onClose={() => setCycleSheet(null)} />}

      {/* Estreno de la camiseta de Haaland (hasta que la reclamen) */}
      {!haalandClaimed && !haalandSkip && (
        <HaalandBanner
          catName={profile.catName}
          onSkip={() => setHaalandSkip(true)}
          onClaim={() => {
            claimReward('haaland', { equipped: ['mn_noruega'], skin: 'pink', background: 'none' })
            setHaalandSkip(true)
            setMood('celebrate')
            flashToast('¡La camiseta de Haaland es tuya! ⚽ Búscala en la Tienda 🎀')
            window.setTimeout(() => setMood(phaseMood), 1800)
          }}
        />
      )}

      <PaymentsDuePopup open={showDuePopup} onClose={() => setShowDuePopup(false)} />
    </main>
  )
}
