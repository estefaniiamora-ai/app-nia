import type { DataProvider } from './provider'
import type {
  Account,
  Category,
  Cycle,
  DataSnapshot,
  EnglishLesson,
  EnglishTask,
  FoodLog,
  Garment,
  Gamification,
  ID,
  Movement,
  Outfit,
  Note,
  PaymentReminder,
  Profile,
  TokenEntry,
  WorkStats,
  Workout,
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
      workouts: parsed.workouts ?? [],
      foodLogs: parsed.foodLogs ?? [],
      lessons: parsed.lessons ?? [],
      englishTasks: parsed.englishTasks ?? [],
      outfits: parsed.outfits ?? [],
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

  async upsertWorkout(workout: Workout): Promise<void> {
    const i = this.snap.workouts.findIndex((w) => w.id === workout.id)
    if (i >= 0) this.snap.workouts[i] = workout
    else this.snap.workouts.push(workout)
    this.persist()
  }

  async removeWorkout(id: ID): Promise<void> {
    this.snap.workouts = this.snap.workouts.filter((w) => w.id !== id)
    this.persist()
  }

  async upsertFoodLog(log: FoodLog): Promise<void> {
    const i = this.snap.foodLogs.findIndex((f) => f.id === log.id)
    if (i >= 0) this.snap.foodLogs[i] = log
    else this.snap.foodLogs.push(log)
    this.persist()
  }

  async removeFoodLog(id: ID): Promise<void> {
    this.snap.foodLogs = this.snap.foodLogs.filter((f) => f.id !== id)
    this.persist()
  }

  async upsertLesson(lesson: EnglishLesson): Promise<void> {
    const i = this.snap.lessons.findIndex((l) => l.id === lesson.id)
    if (i >= 0) this.snap.lessons[i] = lesson
    else this.snap.lessons.push(lesson)
    this.persist()
  }

  async removeLesson(id: ID): Promise<void> {
    this.snap.lessons = this.snap.lessons.filter((l) => l.id !== id)
    this.persist()
  }

  async upsertEnglishTask(task: EnglishTask): Promise<void> {
    const i = this.snap.englishTasks.findIndex((t) => t.id === task.id)
    if (i >= 0) this.snap.englishTasks[i] = task
    else this.snap.englishTasks.push(task)
    this.persist()
  }

  async removeEnglishTask(id: ID): Promise<void> {
    this.snap.englishTasks = this.snap.englishTasks.filter((t) => t.id !== id)
    this.persist()
  }

  async upsertOutfit(outfit: Outfit): Promise<void> {
    const i = this.snap.outfits.findIndex((o) => o.id === outfit.id)
    if (i >= 0) this.snap.outfits[i] = outfit
    else this.snap.outfits.push(outfit)
    this.persist()
  }

  async removeOutfit(id: ID): Promise<void> {
    this.snap.outfits = this.snap.outfits.filter((o) => o.id !== id)
    this.persist()
  }

  /* ----- prendas (aparte, porque traen foto) ----- */
  private leerPrendas(): Garment[] {
    try {
      return JSON.parse(localStorage.getItem('nia.garments.v1') ?? '[]') as Garment[]
    } catch {
      return []
    }
  }
  private guardarPrendas(lista: Garment[]) {
    try {
      localStorage.setItem('nia.garments.v1', JSON.stringify(lista))
    } catch (e) {
      console.warn('No se pudieron guardar las prendas', e)
    }
  }

  async listGarments(): Promise<Garment[]> {
    return this.leerPrendas()
  }

  async upsertGarment(garment: Garment): Promise<void> {
    const lista = this.leerPrendas()
    const i = lista.findIndex((g) => g.id === garment.id)
    if (i >= 0) lista[i] = garment
    else lista.push(garment)
    this.guardarPrendas(lista)
  }

  async removeGarment(id: ID): Promise<void> {
    this.guardarPrendas(this.leerPrendas().filter((g) => g.id !== id))
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
