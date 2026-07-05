import type { Gamification } from './types'
import { localDayKey, daysBetween } from '../lib/date'

export type ItemKind = 'accessory' | 'skin' | 'background'

/** Saga temática a la que pertenece un accesorio (para agrupar visualmente). */
export type Saga = 'onepiece' | 'demonslayer' | 'harrypotter' | 'marvel' | 'hungergames'

export interface ShopItem {
  id: string
  name: string
  emoji: string // ícono para la tarjeta
  /** días de racha necesarios para desbloquearlo (0 = gratis desde el inicio) */
  unlockStreak: number
  kind: ItemKind
  /** meses (1-12) en que está disponible; si falta = siempre */
  seasonal?: number[]
  /** saga temática (solo estético/agrupar) */
  saga?: Saga
  /** evento por tiempo limitado (pestaña aparte, desbloqueo por calendario) */
  event?: 'mundial'
  /** para eventos: día (desde el inicio del evento) en que se desbloquea (0 = ya) */
  unlockDay?: number
  /** premio GLAM: se desbloquea al cumplir N metas semanales (pestaña Glam 💋) */
  unlockGoal?: number
}

/* ============================================================
   MUNDIAL ⚽ — evento por tiempo limitado.
   No se desbloquea por racha sino por CALENDARIO: una pieza nueva
   cada día desde el inicio, para alcanzar a tenerlas todas antes
   de que acabe el Mundial. Colombia viene desbloqueada (día 0).
   ============================================================ */
export const MUNDIAL_START = '2026-06-30' // día 0 (Colombia ya desbloqueada)
export const MUNDIAL_END = '2026-07-19'   // fin del Mundial

/* Progresión por RACHA: entre más días seguidos entrando, más cosas se
   desbloquean. Una vez alcanzada la racha, queda desbloqueado PARA SIEMPRE
   (se usa bestStreak, no la racha actual). */
export const SHOP_ITEMS: ShopItem[] = [
  // ---- Accesorios base ----
  { id: 'bow', name: 'Moño', emoji: '🎀', unlockStreak: 2, kind: 'accessory' },
  { id: 'flower', name: 'Flor', emoji: '🌸', unlockStreak: 4, kind: 'accessory' },
  { id: 'glasses', name: 'Gafas', emoji: '👓', unlockStreak: 7, kind: 'accessory' },
  { id: 'scarf', name: 'Bufanda', emoji: '🧣', unlockStreak: 10, kind: 'accessory' },
  { id: 'hat', name: 'Gorrito', emoji: '🎉', unlockStreak: 14, kind: 'accessory' },
  { id: 'crown', name: 'Corona', emoji: '👑', unlockStreak: 21, kind: 'accessory' },
  { id: 'santa', name: 'Gorro navideño', emoji: '🎅', unlockStreak: 3, kind: 'accessory', seasonal: [12] },

  // ---- One Piece 🏴‍☠️ ----
  { id: 'op_scar', name: 'Cicatriz de Luffy', emoji: '🩹', unlockStreak: 6, kind: 'accessory', saga: 'onepiece' },
  { id: 'strawhat', name: 'Sombrero de Luffy', emoji: '👒', unlockStreak: 30, kind: 'accessory', saga: 'onepiece' },
  { id: 'op_chopper', name: 'Gorro de Chopper', emoji: '🦌', unlockStreak: 16, kind: 'accessory', saga: 'onepiece' },
  { id: 'op_zoro', name: 'Bandana de Zoro', emoji: '🗡️', unlockStreak: 24, kind: 'accessory', saga: 'onepiece' },

  // ---- Demon Slayer ⚔️ ----
  { id: 'ds_earrings', name: 'Aretes de Tanjiro', emoji: '🎴', unlockStreak: 9, kind: 'accessory', saga: 'demonslayer' },
  { id: 'ds_haori', name: 'Haori a cuadros', emoji: '🟩', unlockStreak: 13, kind: 'accessory', saga: 'demonslayer' },
  { id: 'ds_muzzle', name: 'Bambú de Nezuko', emoji: '🎍', unlockStreak: 18, kind: 'accessory', saga: 'demonslayer' },
  { id: 'ds_foxmask', name: 'Máscara de zorro', emoji: '🦊', unlockStreak: 26, kind: 'accessory', saga: 'demonslayer' },

  // ---- Harry Potter ⚡ ----
  { id: 'hp_glasses', name: 'Gafas de Harry', emoji: '⚡', unlockStreak: 8, kind: 'accessory', saga: 'harrypotter' },
  { id: 'hp_scarf', name: 'Bufanda Gryffindor', emoji: '🧣', unlockStreak: 11, kind: 'accessory', saga: 'harrypotter' },
  { id: 'hp_hat', name: 'Sombrero seleccionador', emoji: '🎩', unlockStreak: 22, kind: 'accessory', saga: 'harrypotter' },

  // ---- Marvel 🦸 ----
  { id: 'mv_cap', name: 'Capitán América', emoji: '🛡️', unlockStreak: 15, kind: 'accessory', saga: 'marvel' },
  { id: 'mv_spidey', name: 'Spider-Man', emoji: '🕷️', unlockStreak: 19, kind: 'accessory', saga: 'marvel' },
  { id: 'mv_thor', name: 'Casco de Thor', emoji: '🔨', unlockStreak: 25, kind: 'accessory', saga: 'marvel' },
  { id: 'mv_ironman', name: 'Iron Man', emoji: '🤖', unlockStreak: 28, kind: 'accessory', saga: 'marvel' },

  // ---- Los Juegos del Hambre 🏹 ----
  { id: 'hg_pin', name: 'Pin del Sinsajo', emoji: '🐦', unlockStreak: 12, kind: 'accessory', saga: 'hungergames' },
  { id: 'hg_braid', name: 'Trenza de Katniss', emoji: '🎗️', unlockStreak: 17, kind: 'accessory', saga: 'hungergames' },
  { id: 'hg_fire', name: 'En llamas', emoji: '🔥', unlockStreak: 20, kind: 'accessory', saga: 'hungergames' },

  // ---- Mundial ⚽ (evento, se desbloquea por día) ----
  { id: 'mn_colombia', name: 'Camiseta Colombia', emoji: '🇨🇴', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 0 },
  { id: 'mn_headband', name: 'Cintillo tricolor', emoji: '🎽', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 1 },
  { id: 'mn_ball', name: 'Balón', emoji: '⚽', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 2 },
  { id: 'mn_argentina', name: 'Camiseta Argentina', emoji: '🇦🇷', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 3 },
  { id: 'mn_brasil', name: 'Camiseta Brasil', emoji: '🇧🇷', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 4 },
  { id: 'mn_boots', name: 'Guayos', emoji: '👟', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 5 },
  { id: 'mn_trophy', name: 'Copa del Mundo', emoji: '🏆', unlockStreak: 0, kind: 'accessory', event: 'mundial', unlockDay: 6 },

  // ---- Skins del gato ----
  { id: 'pink', name: 'Lila', emoji: '🐱', unlockStreak: 0, kind: 'skin' },
  { id: 'cream', name: 'Cremita', emoji: '🐈', unlockStreak: 12, kind: 'skin' },
  { id: 'gray', name: 'Gris', emoji: '🐈‍⬛', unlockStreak: 20, kind: 'skin' },
  { id: 'black', name: 'Negrito', emoji: '🐈‍⬛', unlockStreak: 30, kind: 'skin' },

  // ---- Fondos ----
  { id: 'none', name: 'Sin fondo', emoji: '⬜', unlockStreak: 0, kind: 'background' },
  { id: 'sky', name: 'Nubes', emoji: '☁️', unlockStreak: 5, kind: 'background' },
  { id: 'hearts', name: 'Corazones', emoji: '💕', unlockStreak: 8, kind: 'background' },
  { id: 'mint', name: 'Menta', emoji: '🌿', unlockStreak: 12, kind: 'background' },
  { id: 'night', name: 'Noche', emoji: '🌙', unlockStreak: 18, kind: 'background' },
]

export const FREE_DEFAULTS = ['pink', 'none']

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}

/** ¿Está disponible por temporada este mes? (no aplica a eventos) */
export function inSeason(item: ShopItem, month: number): boolean {
  if (!item.seasonal) return true
  return item.seasonal.includes(month)
}

/** Días transcurridos del Mundial (0 = día de inicio). */
export function mundialDay(today: string = localDayKey()): number {
  return daysBetween(MUNDIAL_START, today)
}

/** Días que faltan para que acabe el Mundial (0 si ya terminó). */
export function mundialDaysLeft(today: string = localDayKey()): number {
  return Math.max(0, daysBetween(today, MUNDIAL_END))
}

/** Para un ítem de evento bloqueado: cuántos días faltan para desbloquearlo. */
export function unlocksInDays(item: ShopItem, today: string = localDayKey()): number {
  return Math.max(0, (item.unlockDay ?? 0) - mundialDay(today))
}

/** ¿Está desbloqueado? Glam por metas cumplidas; eventos por calendario; resto por racha. */
export function isUnlocked(
  item: ShopItem,
  g: Gamification,
  month: number,
  today: string = localDayKey(),
  goalsMet = 0,
): boolean {
  if (item.unlockGoal != null) {
    return goalsMet >= item.unlockGoal
  }
  if (item.event === 'mundial') {
    return mundialDay(today) >= (item.unlockDay ?? 0)
  }
  if (!inSeason(item, month)) return false
  return (g.bestStreak ?? 0) >= item.unlockStreak
}

function usable(id: string, g: Gamification, month: number, goalsMet = 0): boolean {
  if (FREE_DEFAULTS.includes(id)) return true
  const it = itemById(id)
  return !!it && isUnlocked(it, g, month, localDayKey(), goalsMet)
}

/** "Look" del gato filtrado a SOLO lo desbloqueado (lo bloqueado no se muestra).
 *  Útil para limpiar accesorios/skins que quedaron puestos pero ya no se tienen
 *  (p. ej. un premio glam que se perdió al editar los tokens de esa semana). */
export function effectiveLook(
  g: Gamification,
  month: number,
  goalsMet = 0,
): { equipped: string[]; skin: string; background: string } {
  return {
    equipped: (g.equipped ?? []).filter((id) => usable(id, g, month, goalsMet)),
    skin: usable(g.skin, g, month, goalsMet) ? g.skin : 'pink',
    background: usable(g.background, g, month, goalsMet) ? g.background : 'none',
  }
}
