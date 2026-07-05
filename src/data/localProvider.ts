import type { DataProvider } from './provider'
import type {
  Account,
  Category,
  Cycle,
  DataSnapshot,
  Gamification,
  ID,
  Movement,
  Note,
  PaymentReminder,
  Profile,
  TokenEntry,
  WorkStats,
} from './types'
import { emptySnapshot } from './seed'

/* ===========================================================
   LocalProvider — guarda en localStorage.
   No es una "demo de mentiras": es el modo offline funcionando
   con datos reales. El día que conectemos Firebase, esta clase
   se reemplaza por FirebaseProvider y la app no se entera.
   =========================================================== */

const KEY = 'nia.snapshot.v1'

function read(): DataSnapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySnapshot()
    const parsed = JSON.parse(raw) as DataSnapshot
    // merge defensivo por si faltan campos nuevos
    const base = emptySnapshot()
    return {
      profile: { ...base.profile, ...parsed.profile },
      accounts: parsed.accounts ?? [],
      categories: parsed.categories?.length ? parsed.categories : base.categories,
      movements: parsed.movements ?? [],
      gamification: { ...base.gamification, ...parsed.gamification },
      tokenEntries: parsed.tokenEntries ?? [],
      workStats: { ...base.workStats, ...parsed.workStats },
      reminders: parsed.reminders ?? [],
      notes: parsed.notes ?? [],
      cycle: { ...base.cycle, ...(parsed.cycle ?? {}) },
    }
  } catch {
    return emptySnapshot()
  }
}

export class LocalProvider implements DataProvider {
  private snap: DataSnapshot

  constructor() {
    this.snap = read()
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.snap))
    } catch (e) {
      console.warn('No se pudo guardar localmente', e)
    }
  }

  async load(): Promise<DataSnapshot> {
    this.snap = read()
    return structuredCloneSafe(this.snap)
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.snap.profile = profile
    this.persist()
  }

  async upsertAccount(account: Account): Promise<void> {
    const i = this.snap.accounts.findIndex((a) => a.id === account.id)
    if (i >= 0) this.snap.accounts[i] = account
    else this.snap.accounts.push(account)
    this.persist()
  }

  async removeAccount(id: ID): Promise<void> {
    this.snap.accounts = this.snap.accounts.filter((a) => a.id !== id)
    this.persist()
  }

  async upsertCategory(category: Category): Promise<void> {
    const i = this.snap.categories.findIndex((c) => c.id === category.id)
    if (i >= 0) this.snap.categories[i] = category
    else this.snap.categories.push(category)
    this.persist()
  }

  async removeCategory(id: ID): Promise<void> {
    this.snap.categories = this.snap.categories.filter((c) => c.id !== id)
    this.persist()
  }

  async upsertMovement(movement: Movement): Promise<void> {
    const i = this.snap.movements.findIndex((m) => m.id === movement.id)
    if (i >= 0) this.snap.movements[i] = movement
    else this.snap.movements.push(movement)
    this.persist()
  }

  async removeMovement(id: ID): Promise<void> {
    this.snap.movements = this.snap.movements.filter((m) => m.id !== id)
    this.persist()
  }

  async saveGamification(gamification: Gamification): Promise<void> {
    this.snap.gamification = gamification
    this.persist()
  }

  async upsertTokenEntry(entry: TokenEntry): Promise<void> {
    const i = this.snap.tokenEntries.findIndex((t) => t.id === entry.id)
    if (i >= 0) this.snap.tokenEntries[i] = entry
    else this.snap.tokenEntries.push(entry)
    this.persist()
  }

  async removeTokenEntry(id: ID): Promise<void> {
    this.snap.tokenEntries = this.snap.tokenEntries.filter((t) => t.id !== id)
    this.persist()
  }

  async saveWorkStats(workStats: WorkStats): Promise<void> {
    this.snap.workStats = workStats
    this.persist()
  }

  async upsertReminder(reminder: PaymentReminder): Promise<void> {
    const i = this.snap.reminders.findIndex((r) => r.id === reminder.id)
    if (i >= 0) this.snap.reminders[i] = reminder
    else this.snap.reminders.push(reminder)
    this.persist()
  }

  async removeReminder(id: ID): Promise<void> {
    this.snap.reminders = this.snap.reminders.filter((r) => r.id !== id)
    this.persist()
  }

  async upsertNote(note: Note): Promise<void> {
    const i = this.snap.notes.findIndex((n) => n.id === note.id)
    if (i >= 0) this.snap.notes[i] = note
    else this.snap.notes.push(note)
    this.persist()
  }

  async removeNote(id: ID): Promise<void> {
    this.snap.notes = this.snap.notes.filter((n) => n.id !== id)
    this.persist()
  }

  async saveCycle(cycle: Cycle): Promise<void> {
    this.snap.cycle = cycle
    this.persist()
  }

  async reset(): Promise<void> {
    this.snap = emptySnapshot()
    this.persist()
  }
}

function structuredCloneSafe<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v)
  return JSON.parse(JSON.stringify(v))
}
