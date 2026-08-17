/* ===========================================================
   Modelos de dominio de Nia App
   Los montos SIEMPRE se guardan en centavos (enteros) para
   evitar errores de redondeo con decimales.
   =========================================================== */

export type ID = string

export type ThemePref = 'light' | 'dark' | 'system'
export type CatPresence = 'full' | 'medium' | 'low'

/** Moneda de una cuenta. Si falta = pesos colombianos (cuentas viejas). */
export type Currency = 'COP' | 'USD'

/** Tipo de cuenta:
 *  - 'normal': cuenta real (Nequi, efectivo…) → cuenta en el Saldo total.
 *  - 'person': cuenta de persona/deuda → NO toca el Saldo total; va aparte.
 *    El signo del saldo dice la dirección: (+) te deben, (−) le debes.
 *    Al llegar a 0 se archiva sola. Si falta = 'normal' (cuentas viejas). */
export type AccountKind = 'normal' | 'person'

/** Recordatorios que puede activar (cada uno con su hora 'HH:MM'). */
export type ReminderKind = 'gym' | 'comida' | 'cuentas' | 'ingles'

export interface NotifPrefs {
  /** interruptor general */
  enabled: boolean
  /** hora de cada recordatorio; si falta, ese está apagado */
  times: Partial<Record<ReminderKind, string>>
}

export interface Profile {
  userName: string          // "Nia"
  catName: string           // se elige en el onboarding
  theme: ThemePref
  catPresence: CatPresence
  hideBalance: boolean
  onboarded: boolean
  createdAt: number
  /** Metas diarias de comida (faltan = sin meta puesta todavía). */
  kcalGoal?: number         // calorías al día
  proteinGoal?: number      // gramos de proteína al día
  carbGoal?: number         // gramos de carbohidratos al día
  fatGoal?: number          // gramos de grasas al día
  /** recordatorios del celular (falta = apagados) */
  notif?: NotifPrefs
}

export interface Account {
  id: ID
  name: string
  emoji: string             // emoji libre del teclado
  color: string             // hex de la paleta ('' = color por defecto)
  currency?: Currency       // moneda de la cuenta (falta = 'COP')
  kind?: AccountKind        // 'person' = deuda/persona (falta = 'normal')
  archived: boolean
  /** eliminada: se oculta de todos lados PERO sus movimientos quedan como
   *  historial (se conserva el registro para poder mostrar el nombre). */
  deleted?: boolean
  order: number
  createdAt: number
}

/** Moneda efectiva de una cuenta (las viejas, sin campo, son COP). */
export function accountCurrency(a: Account): Currency {
  return a.currency ?? 'COP'
}

/** Tipo efectivo de una cuenta (las viejas, sin campo, son 'normal'). */
export function accountKind(a: Account): AccountKind {
  return a.kind ?? 'normal'
}

/** ¿Es una cuenta de persona/deuda? */
export function isPersonAccount(a: Account): boolean {
  return accountKind(a) === 'person'
}

/** Categoría = bolsa COMPARTIDA (no atada a ingreso/gasto). */
export interface Category {
  id: ID
  name: string
  emoji: string
  color: string
  createdAt: number
}

export type MovementType = 'income' | 'expense' | 'transfer' | 'adjust'

export interface Movement {
  id: ID
  type: MovementType
  amount: number            // centavos, SIEMPRE positivo (en la moneda de accountId)
  accountId: ID             // cuenta origen (en transfer = "desde")
  toAccountId?: ID          // transfer: cuenta destino
  /** transfer entre monedas distintas: cuánto LLEGA a la cuenta destino
   *  (centavos, en la moneda de toAccountId). Si falta = mismo monto que amount. */
  amountTo?: number
  /** transfer pendiente: ya salió del origen pero aún no llega al destino.
   *  Mientras esté pendiente, el destino NO se acredita. */
  pending?: boolean
  categoryId?: ID           // income / expense (no aplica a transfer)
  note?: string
  /** dirección sólo para 'adjust': suma o resta del saldo (neutral en stats) */
  direction?: 'in' | 'out'
  date: number              // fecha + hora (timestamp)
  createdAt: number
}

export interface Gamification {
  streak: number                 // racha actual (días seguidos entrando)
  bestStreak: number             // racha máxima alcanzada → desbloquea ítems para siempre
  lastClaimDate: string | null   // 'YYYY-MM-DD' local
  equipped: string[]             // accesorios puestos (varios a la vez)
  skin: string                   // id del skin del gato
  background: string             // id del fondo
  /** recompensas de ocasión ya reclamadas (p. ej. 'haaland'). Una vez aquí,
   *  el ítem queda desbloqueado para siempre y su banner no vuelve a salir. */
  claims?: string[]
  coins?: number                 // (obsoleto) se mantiene por compatibilidad
  owned?: string[]               // (obsoleto)
  unlocked?: string[]            // (obsoleto)
}

/* ----- Registro de tokens de trabajo (webcam) + metas semanales ----- */
export interface TokenEntry {
  id: ID
  date: number              // fecha del registro (timestamp)
  tokens: number            // entero positivo
  note?: string
  createdAt: number
}

export interface WorkStats {
  /** meta semanal en tokens (0 = aún sin meta puesta) */
  weeklyGoal: number
  /** meta "congelada" por semana (clave = lunes de la semana 'YYYY-MM-DD').
   *  Se fija la primera vez que una semana cumple, para que subir la meta
   *  luego no quite premios ya ganados. */
  weekGoals: Record<string, number>
}

/* ----- Recordatorios de pago (dentro de Cuentas) ----- */
export type ReminderFreq = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'

export interface PaymentReminder {
  id: ID
  name: string
  emoji?: string
  amount?: number            // centavos (opcional)
  accountId?: ID             // cuenta de la que se paga (opcional)
  periodic: boolean          // true = periódico, false = una sola vez
  freq?: ReminderFreq        // solo si periodic
  nextDate: number           // timestamp del próximo pago
  note?: string
  active: boolean            // se puede desactivar sin borrar
  done?: boolean             // 'una vez' ya pagado
  createdAt: number
}

/* ----- Notitas (tablero de stickers) ----- */
export type NoteColor = 'pink' | 'lav' | 'mint' | 'peach' | 'yellow'

export interface NoteItem {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: ID
  emoji?: string
  title?: string
  body?: string              // texto libre (cuando no es checklist)
  items?: NoteItem[]         // casillas (cuando isChecklist)
  isChecklist: boolean
  color: NoteColor
  pinned: boolean
  createdAt: number
  updatedAt: number
}

/* ----- Ciclo menstrual (rincón íntimo) -----
 *  Los días con regla son la fuente de verdad; los "periodos" (rangos) y las
 *  predicciones se DERIVAN de ahí (ver lib/cycle.ts). Todo vive dentro del
 *  doc users/{uid}, así se carga en la misma lectura que el perfil. */
export type FlowLevel = 'light' | 'medium' | 'heavy'

/** Detalle OPCIONAL de un día (nunca obligatorio, no afecta la racha). */
export interface CycleDayLog {
  flow?: FlowLevel
  pain?: number            // 0-10
  mood?: string            // emoji/etiqueta libre
  symptoms?: string[]
  note?: string
}

export interface Cycle {
  /** días con regla 'YYYY-MM-DD' (fuente de verdad). */
  bledDays: string[]
  /** detalles opcionales por día. */
  logs: Record<string, CycleDayLog>
  /** promedios manuales opcionales; si faltan, se aprenden de los datos. */
  avgCycle?: number
  avgPeriod?: number
  /** mostrar ventana fértil / ovulación (ella lo eligió: sí). */
  showFertility: boolean
}

export interface DataSnapshot {
  profile: Profile
  accounts: Account[]
  categories: Category[]
  movements: Movement[]
  gamification: Gamification
  tokenEntries: TokenEntry[]
  workStats: WorkStats
  reminders: PaymentReminder[]
  notes: Note[]
  cycle: Cycle
  workouts: Workout[]
  foodLogs: FoodLog[]
  lessons: EnglishLesson[]
  englishTasks: EnglishTask[]
  /** outfits de la semana (livianos: solo referencias a prendas) */
  outfits: Outfit[]
}

/* ===========================================================
   GYM — entrenamientos
   El peso se guarda en GRAMOS (entero), igual que la plata en
   centavos: nada de decimales guardados.
   =========================================================== */

export interface WorkoutSet {
  reps: number
  /** peso en gramos (30000 = 30 kg). 0 o ausente = solo peso corporal. */
  weightG?: number
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: ID
  date: string              // 'YYYY-MM-DD' (día del entreno)
  name: string              // 'Pierna', 'Pecho y tríceps'…
  emoji?: string
  durationMin?: number
  /** peso corporal de ese día en gramos (opcional). */
  bodyWeightG?: number
  note?: string
  exercises: WorkoutExercise[]
  createdAt: number
}

/* ===========================================================
   COMIDA — registro de nutrientes
   Un registro = un alimento comido. Las cantidades van en
   gramos enteros y los macros en gramos enteros (redondeados).
   =========================================================== */

export type MealSlot = 'desayuno' | 'almuerzo' | 'cena' | 'snack'

export const MEAL_SLOTS: { key: MealSlot; label: string; emoji: string }[] = [
  { key: 'desayuno', label: 'Desayuno', emoji: '🌅' },
  { key: 'almuerzo', label: 'Almuerzo', emoji: '☀️' },
  { key: 'cena', label: 'Cena', emoji: '🌙' },
  { key: 'snack', label: 'Snacks', emoji: '🍎' },
]

export interface FoodLog {
  id: ID
  date: string              // 'YYYY-MM-DD'
  slot: MealSlot
  name: string
  grams: number             // cantidad comida, en gramos
  kcal: number              // ya calculado para esa cantidad
  protein: number           // gramos
  carbs: number             // gramos
  fat: number               // gramos
  foodId?: string           // id del alimento de la tabla (si salió de ahí)
  createdAt: number
}

/* ===========================================================
   INGLÉS — clases, tareas y palabras nuevas
   =========================================================== */

/** Palabra nueva aprendida en una clase. */
export interface VocabWord {
  id: string
  en: string                // 'homework'
  es: string                // 'tarea'
  example?: string          // frase de ejemplo (opcional)
}

/** Una clase de inglés: qué vimos y qué aprendí. */
export interface EnglishLesson {
  id: ID
  date: string              // 'YYYY-MM-DD'
  title: string             // tema de la clase
  emoji?: string
  learned?: string          // "qué aprendí hoy" (texto libre)
  words: VocabWord[]
  createdAt: number
}

/** Tarea de inglés. Puede venir de una clase o ser suelta. */
export interface EnglishTask {
  id: ID
  text: string
  /** clase de la que salió (opcional) */
  lessonId?: ID
  /** fecha de entrega 'YYYY-MM-DD' (opcional) */
  due?: string
  done: boolean
  doneAt?: number
  createdAt: number
}

/* ===========================================================
   MI CLÓSET — prendas y outfits
   Las fotos se guardan comprimidas (dataURL) dentro de la prenda.
   Por eso las prendas viven en su propia colección y se cargan
   SOLO cuando ella abre el clóset (para no gastar datos al abrir).
   =========================================================== */

export type GarmentKind = 'top' | 'bottom' | 'vestido' | 'zapatos' | 'abrigo' | 'accesorio'
export type GarmentStyle =
  | 'casual'
  | 'elegante'
  | 'deportivo'
  | 'salir'
  | 'rave'
  | 'playa'
  | 'tumblr'
  | 'aesthetic'
  | 'coquette'
  | 'y2k'
  | 'oficina'
  | 'comodo'
export type GarmentWeather = 'calor' | 'templado' | 'frio'

export interface Garment {
  id: ID
  name: string
  kind: GarmentKind
  /** id del color de la paleta (ver data/closet.ts) */
  color: string
  /** para qué ocasiones sirve (puede ser varias) */
  styles: GarmentStyle[]
  weather?: GarmentWeather
  /** foto comprimida en dataURL (opcional: puede quedarse solo con el nombre) */
  photo?: string
  favorite?: boolean
  archived?: boolean
  createdAt: number
}

/** Un outfit. Si tiene `date`, está puesto en ese día de la semana;
 *  si NO tiene fecha, es un outfit guardado como favorito (con nombre). */
export interface Outfit {
  id: ID
  date?: string             // 'YYYY-MM-DD'
  /** nombre, solo para los guardados como favoritos */
  name?: string
  garmentIds: ID[]
  note?: string
  createdAt: number
}

/* ----- Efecto de cada movimiento sobre el saldo de una cuenta ----- */
export function accountDelta(m: Movement, accountId: ID): number {
  switch (m.type) {
    case 'income':
      return m.accountId === accountId ? m.amount : 0
    case 'expense':
      return m.accountId === accountId ? -m.amount : 0
    case 'adjust':
      if (m.accountId !== accountId) return 0
      return m.direction === 'out' ? -m.amount : m.amount
    case 'transfer':
      if (m.accountId === accountId) return -m.amount
      // el destino solo recibe si NO está pendiente; y recibe amountTo (moneda destino)
      if (m.toAccountId === accountId) return m.pending ? 0 : m.amountTo ?? m.amount
      return 0
  }
}

/** Cuánto ENTRA a la cuenta destino de una transferencia (moneda destino). */
export function transferInAmount(m: Movement): number {
  return m.amountTo ?? m.amount
}

/** ¿Este movimiento cuenta en las estadísticas de ingreso/gasto? */
export function countsInStats(m: Movement): boolean {
  return m.type === 'income' || m.type === 'expense'
}
