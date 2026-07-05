import type { Category, Cycle, DataSnapshot, Gamification, Profile, WorkStats } from './types'
import { uid } from '../lib/id'

/** Paleta pastel para categorías/cuentas. */
export const PALETTE = [
  '#ff8fb8', '#ffa9c4', '#ff9ec7', '#ffb38a', '#ffce6b',
  '#9ad9b0', '#7fd1c4', '#8fc7ff', '#b8a6ff', '#d6a6ff',
  '#ff9aa2', '#c9e08a',
]

/** Categorías base. Se siembran en la base de datos junto a las de ella,
 *  indistinguibles, y se ordenan alfabéticamente. */
const BASE_CATEGORIES: Array<Omit<Category, 'id' | 'createdAt'>> = [
  { name: 'Antojos', emoji: '🍰', color: '#ff9ec7' },
  { name: 'Arriendo', emoji: '🏠', color: '#b8a6ff' },
  { name: 'Belleza', emoji: '💅', color: '#ff8fb8' },
  { name: 'Comida', emoji: '🍔', color: '#ffb38a' },
  { name: 'Gustos personales', emoji: '🎁', color: '#d6a6ff' },
  { name: 'Mascotas', emoji: '🐾', color: '#9ad9b0' },
  { name: 'Mercado', emoji: '🛒', color: '#c9e08a' },
  { name: 'Propinas', emoji: '🎀', color: '#ffce6b' },
  { name: 'Ropa', emoji: '👗', color: '#ffa9c4' },
  { name: 'Salud', emoji: '💊', color: '#7fd1c4' },
  { name: 'Servicios', emoji: '💡', color: '#8fc7ff' },
  { name: 'Tatuajes', emoji: '🖋️', color: '#ff9aa2' },
  { name: 'Transporte', emoji: '🚕', color: '#ffce6b' },
  { name: 'Webcam', emoji: '💻', color: '#b8a6ff' },
]

function slugId(name: string): string {
  return (
    'cat_' +
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  )
}

export function seedCategories(): Category[] {
  const now = Date.now()
  return BASE_CATEGORIES.map((c, i) => ({
    ...c,
    id: slugId(c.name), // id estable → re-sembrar no duplica
    createdAt: now + i, // mantiene orden estable de inserción
  }))
}

export function defaultProfile(): Profile {
  return {
    userName: 'Nia',
    catName: 'Michi',
    theme: 'light',
    catPresence: 'full',
    hideBalance: false,
    onboarded: false,
    createdAt: Date.now(),
  }
}

export function defaultGamification(): Gamification {
  return {
    streak: 0,
    bestStreak: 0,
    lastClaimDate: null,
    equipped: [],
    skin: 'pink',
    background: 'none',
  }
}

export function defaultWorkStats(): WorkStats {
  return {
    weeklyGoal: 0,
    weekGoals: {},
  }
}

export function defaultCycle(): Cycle {
  return {
    bledDays: [],
    logs: {},
    showFertility: true,
  }
}

export function emptySnapshot(): DataSnapshot {
  return {
    profile: defaultProfile(),
    accounts: [],
    categories: seedCategories(),
    movements: [],
    gamification: defaultGamification(),
    tokenEntries: [],
    workStats: defaultWorkStats(),
    reminders: [],
    notes: [],
    cycle: defaultCycle(),
  }
}
