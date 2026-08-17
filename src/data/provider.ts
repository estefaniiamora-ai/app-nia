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

/* ===========================================================
   DataProvider — la "interfaz enchufable".
   HOY la implementa LocalProvider (localStorage).
   MAÑANA la implementará FirebaseProvider (Firestore + Auth),
   sin tocar el resto de la app.
   Métodos granulares para que el adaptador de Firebase pueda
   escribir documento por documento (sin derrochar lecturas).
   =========================================================== */
export interface DataProvider {
  /** Carga todo el estado (una sola vez al abrir). */
  load(): Promise<DataSnapshot>

  saveProfile(profile: Profile): Promise<void>

  upsertAccount(account: Account): Promise<void>
  removeAccount(id: ID): Promise<void>

  upsertCategory(category: Category): Promise<void>
  removeCategory(id: ID): Promise<void>

  upsertMovement(movement: Movement): Promise<void>
  removeMovement(id: ID): Promise<void>

  saveGamification(gamification: Gamification): Promise<void>

  upsertTokenEntry(entry: TokenEntry): Promise<void>
  removeTokenEntry(id: ID): Promise<void>
  saveWorkStats(workStats: WorkStats): Promise<void>

  upsertReminder(reminder: PaymentReminder): Promise<void>
  removeReminder(id: ID): Promise<void>

  upsertNote(note: Note): Promise<void>
  removeNote(id: ID): Promise<void>

  upsertWorkout(workout: Workout): Promise<void>
  removeWorkout(id: ID): Promise<void>

  upsertFoodLog(log: FoodLog): Promise<void>
  removeFoodLog(id: ID): Promise<void>

  upsertLesson(lesson: EnglishLesson): Promise<void>
  removeLesson(id: ID): Promise<void>

  upsertEnglishTask(task: EnglishTask): Promise<void>
  removeEnglishTask(id: ID): Promise<void>

  upsertOutfit(outfit: Outfit): Promise<void>
  removeOutfit(id: ID): Promise<void>

  /** Las prendas traen foto: se piden aparte, solo al abrir el clóset. */
  listGarments(): Promise<Garment[]>
  upsertGarment(garment: Garment): Promise<void>
  removeGarment(id: ID): Promise<void>

  /** Guarda el ciclo completo (objeto compacto dentro del doc del usuario). */
  saveCycle(cycle: Cycle): Promise<void>

  /** Borra todo (útil para "empezar de cero" o pruebas). */
  reset(): Promise<void>
}
