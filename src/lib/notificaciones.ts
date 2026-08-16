/* ===========================================================
   Recordatorios del celular.

   Cómo funciona (sin servidor, todo en el teléfono):
   1) Si el navegador soporta notificaciones PROGRAMADAS
      (TimestampTrigger — Chrome/Android con la app instalada),
      se dejan agendadas para los próximos días y llegan aunque
      la app esté cerrada.
   2) Si no las soporta (iPhone, Firefox…), se avisan mientras la
      app esté abierta y, al entrar, se muestra lo que quedó
      pendiente del día.
   =========================================================== */

import type { ReminderKind, NotifPrefs } from '../data/types'

/** Cuántos días hacia adelante se dejan agendados los recordatorios. */
const DIAS_AGENDADOS = 7

export const RECORDATORIOS: {
  key: ReminderKind
  label: string
  emoji: string
  titulo: string
  cuerpo: string
  ruta: string
  horaSugerida: string
}[] = [
  {
    key: 'gym',
    label: 'Mi Gym',
    emoji: '💪',
    titulo: '¿Ya entrenaste hoy? 💪',
    cuerpo: 'Anota tu entreno en Nia para no perder tu progreso.',
    ruta: '/gym',
    horaSugerida: '19:00',
  },
  {
    key: 'comida',
    label: 'Mi Comida',
    emoji: '🥗',
    titulo: '¿Qué comiste hoy? 🥗',
    cuerpo: 'Registra tus comidas y mira cómo vas con tus metas.',
    ruta: '/comida',
    horaSugerida: '20:00',
  },
  {
    key: 'cuentas',
    label: 'Mis cuentas',
    emoji: '💸',
    titulo: 'Un ratico para tus cuentas 💸',
    cuerpo: 'Anota lo que gastaste hoy, así no se te pierde nada.',
    ruta: '/movimientos',
    horaSugerida: '21:00',
  },
  {
    key: 'ingles',
    label: 'Mi Inglés',
    emoji: '📚',
    titulo: '¿Cómo va el inglés? 📚',
    cuerpo: 'Anota tu clase, tus tareas o practica tus palabras.',
    ruta: '/ingles',
    horaSugerida: '18:00',
  },
]

/** ¿El navegador puede mostrar notificaciones? */
export function soportaNotificaciones(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

/** ¿Puede dejarlas AGENDADAS (llegan con la app cerrada)? */
export function soportaProgramadas(): boolean {
  return typeof window !== 'undefined' && 'TimestampTrigger' in window
}

export function permisoActual(): NotificationPermission | 'no-soportado' {
  if (!soportaNotificaciones()) return 'no-soportado'
  return Notification.permission
}

/** Le pide permiso al celular. Devuelve true si quedó autorizado. */
export async function pedirPermiso(): Promise<boolean> {
  if (!soportaNotificaciones()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const r = await Notification.requestPermission()
  return r === 'granted'
}

async function registro(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

/** 'HH:MM' → timestamp del próximo día `offset` a esa hora. */
function momento(hora: string, offsetDias: number): number {
  const [h, m] = hora.split(':').map(Number)
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.getTime()
}

/** Borra los recordatorios ya agendados (para volver a agendarlos). */
async function limpiarAgendados(reg: ServiceWorkerRegistration) {
  try {
    const pendientes = await reg.getNotifications({ includeTriggered: true } as never)
    pendientes.filter((n) => n.tag?.startsWith('nia-rec-')).forEach((n) => n.close())
  } catch {
    /* algunos navegadores no lo soportan: no pasa nada */
  }
}

/**
 * Deja agendados los recordatorios de los próximos días.
 * Se llama cada vez que se abre la app, así siempre hay agenda por delante.
 */
export async function programarRecordatorios(prefs: NotifPrefs | undefined): Promise<void> {
  if (!prefs?.enabled) return
  if (permisoActual() !== 'granted') return
  const reg = await registro()
  if (!reg) return

  await limpiarAgendados(reg)
  if (!soportaProgramadas()) return

  const ahora = Date.now()
  for (const r of RECORDATORIOS) {
    const hora = prefs.times?.[r.key]
    if (!hora) continue
    for (let d = 0; d < DIAS_AGENDADOS; d++) {
      const cuando = momento(hora, d)
      if (cuando <= ahora + 60_000) continue
      try {
        await reg.showNotification(r.titulo, {
          body: r.cuerpo,
          tag: `nia-rec-${r.key}-${d}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { ruta: r.ruta },
          // @ts-expect-error showTrigger aún no está en los tipos de TS
          showTrigger: new window.TimestampTrigger(cuando),
        })
      } catch {
        /* si falla uno, seguimos con los demás */
      }
    }
  }
}

/** Muestra una notificación ya mismo (para el botón de "probar"). */
export async function notificarAhora(titulo: string, cuerpo: string, ruta = '/'): Promise<void> {
  const reg = await registro()
  if (!reg) return
  await reg.showNotification(titulo, {
    body: cuerpo,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'nia-prueba',
    data: { ruta },
  })
}

/**
 * Mientras la app está abierta, avisa a la hora indicada.
 * Devuelve una función para cancelar los avisos programados.
 */
export function avisosMientrasAbierta(prefs: NotifPrefs | undefined): () => void {
  const timers: number[] = []
  if (!prefs?.enabled || permisoActual() !== 'granted') return () => {}

  for (const r of RECORDATORIOS) {
    const hora = prefs.times?.[r.key]
    if (!hora) continue
    const falta = momento(hora, 0) - Date.now()
    // solo si todavía no ha pasado la hora de hoy (y falta menos de 24 h)
    if (falta > 0 && falta < 86_400_000) {
      timers.push(
        window.setTimeout(() => {
          notificarAhora(r.titulo, r.cuerpo, r.ruta)
        }, falta),
      )
    }
  }

  return () => timers.forEach((t) => window.clearTimeout(t))
}
