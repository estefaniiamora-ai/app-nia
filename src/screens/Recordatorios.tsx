import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Cat from '../components/Cat/Cat'
import {
  RECORDATORIOS,
  notificarAhora,
  pedirPermiso,
  permisoActual,
  programarRecordatorios,
  soportaNotificaciones,
  soportaProgramadas,
} from '../lib/notificaciones'
import type { NotifPrefs, ReminderKind } from '../data/types'
import './Recordatorios.css'

/** ¿La app está instalada en el celular (no abierta en el navegador)? */
function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export default function Recordatorios() {
  const { profile, updateProfile } = useApp()
  const navigate = useNavigate()
  const [permiso, setPermiso] = useState(permisoActual())
  const [aviso, setAviso] = useState<string | null>(null)

  const prefs: NotifPrefs = profile.notif ?? { enabled: false, times: {} }
  const puede = soportaNotificaciones()
  const lleganCerrada = soportaProgramadas()

  // cada vez que cambian los recordatorios, se vuelven a dejar agendados
  useEffect(() => {
    programarRecordatorios(profile.notif)
  }, [profile.notif])

  function mostrarAviso(texto: string) {
    setAviso(texto)
    window.setTimeout(() => setAviso(null), 2600)
  }

  async function encender() {
    const ok = await pedirPermiso()
    setPermiso(permisoActual())
    if (!ok) {
      mostrarAviso('Tu celular no dio permiso 🙈')
      return
    }
    // al encender por primera vez, se ponen las horas sugeridas
    const times = { ...prefs.times }
    if (Object.keys(times).length === 0) {
      for (const r of RECORDATORIOS) times[r.key] = r.horaSugerida
    }
    updateProfile({ notif: { enabled: true, times } })
    mostrarAviso('¡Listo! Ya quedaron activados 💗')
  }

  function apagar() {
    updateProfile({ notif: { ...prefs, enabled: false } })
    mostrarAviso('Recordatorios apagados')
  }

  function alternar(key: ReminderKind) {
    const times = { ...prefs.times }
    if (times[key]) delete times[key]
    else times[key] = RECORDATORIOS.find((r) => r.key === key)!.horaSugerida
    updateProfile({ notif: { ...prefs, times } })
  }

  function cambiarHora(key: ReminderKind, hora: string) {
    if (!hora) return
    updateProfile({ notif: { ...prefs, times: { ...prefs.times, [key]: hora } } })
  }

  return (
    <main className="screen rec">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Recordatorios 🔔</h1>
          <p className="screen-sub">Que tu conejito te avise 💗</p>
        </div>
      </div>

      {!puede ? (
        <div className="rec-empty">
          <Cat size={120} mood="sad" alive={false} speech="mmm… 🙈" />
          <h3>Aquí no se pueden</h3>
          <p className="screen-sub">
            Este navegador no deja mandar recordatorios. Abre Nia desde tu celular e instálala, y
            vuelve a entrar aquí 💗
          </p>
        </div>
      ) : (
        <>
          {/* ----- Interruptor general ----- */}
          {!prefs.enabled || permiso !== 'granted' ? (
            <div className="rec-card rec-card--off">
              <Cat size={110} mood="happy" alive={false} speech="¡yo te aviso! 🔔" />
              <h3>Deja que te recuerde</h3>
              <p className="screen-sub">
                Te aviso a la hora que tú elijas para que anotes tu entreno, tu comida, tus cuentas
                y tu inglés. Tú decides cuáles quieres y a qué hora 💗
              </p>
              {permiso === 'denied' ? (
                <p className="rec-nota rec-nota--ojo">
                  Tu celular tiene los avisos bloqueados para Nia 🙈 Búscala en los ajustes del
                  teléfono, en “Notificaciones”, y déjalas activadas. Después vuelve aquí.
                </p>
              ) : (
                <button className="btn btn--primary btn--block" onClick={encender}>
                  Activar mis recordatorios
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="rec-onoff">
                <span className="grow">
                  <b>Recordatorios activados ✅</b>
                  <span className="rec-onoff__sub">Elige cuáles quieres y a qué hora</span>
                </span>
                <button className="btn btn--sm" onClick={apagar}>
                  Apagar
                </button>
              </div>

              <div className="rec-lista">
                {RECORDATORIOS.map((r) => {
                  const hora = prefs.times?.[r.key]
                  const activo = !!hora
                  return (
                    <div key={r.key} className={`rec-item ${activo ? 'rec-item--on' : ''}`}>
                      <span className="rec-item__ic">{r.emoji}</span>
                      <span className="grow">
                        <b>{r.label}</b>
                        <span className="rec-item__sub">
                          {activo ? `te aviso a las ${hora}` : 'apagado'}
                        </span>
                      </span>
                      {activo && (
                        <input
                          className="input rec-item__hora"
                          type="time"
                          value={hora}
                          onChange={(e) => cambiarHora(r.key, e.target.value)}
                          aria-label={`Hora de ${r.label}`}
                        />
                      )}
                      <button
                        className={`rec-switch ${activo ? 'rec-switch--on' : ''}`}
                        onClick={() => alternar(r.key)}
                        aria-label={`${activo ? 'Apagar' : 'Encender'} ${r.label}`}
                      >
                        <span className="rec-switch__dot" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                className="btn btn--block"
                onClick={() => {
                  notificarAhora('¡Hola, soy tu conejito! 🐰', 'Así se te van a ver los recordatorios 💗')
                  mostrarAviso('Te mandé una de prueba 🔔')
                }}
              >
                🔔 Mandarme una de prueba
              </button>
            </>
          )}

          {/* ----- Explicación honesta ----- */}
          <p className="rec-nota">
            {lleganCerrada
              ? '💡 Para que te lleguen aunque tengas la app cerrada, ten Nia instalada en tu celular (te sale un botón para instalarla) y no la cierres desde “apps recientes”.'
              : '💡 Ojo: en este celular los avisos solo llegan mientras Nia esté abierta. Igual, cada vez que entres te muestro lo que te falta anotar del día 💗'}
          </p>
        </>
      )}

      {!estaInstalada() && puede && (
        <p className="rec-nota">
          📲 ¿Todavía no tienes Nia instalada en tu pantalla de inicio? Instálala y los
          recordatorios funcionan mucho mejor.
        </p>
      )}

      {aviso && <div className="rec-toast">{aviso}</div>}
    </main>
  )
}
