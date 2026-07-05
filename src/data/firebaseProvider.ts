import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
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
import { defaultCycle, defaultGamification, defaultProfile, defaultWorkStats, emptySnapshot } from './seed'

/* ===========================================================
   FirebaseProvider — guarda en Firestore, por usuario.
   Estructura:
     users/{uid}                      → { profile, gamification }
     users/{uid}/accounts/{id}
     users/{uid}/categories/{id}
     users/{uid}/movements/{id}
   Implementa la MISMA interfaz que LocalProvider, así que la app
   no cambia: solo se cambia el "enchufe".
   =========================================================== */
export class FirebaseProvider implements DataProvider {
  private uid: string

  constructor(uid: string) {
    this.uid = uid
  }

  private userRef() {
    return doc(db, 'users', this.uid)
  }
  private coll(name: string) {
    return collection(db, 'users', this.uid, name)
  }
  private itemRef(name: string, id: ID) {
    return doc(db, 'users', this.uid, name, id)
  }

  async load(): Promise<DataSnapshot> {
    const userSnap = await getDoc(this.userRef())

    // Usuario nuevo → sembrar perfil + gamificación + categorías base.
    if (!userSnap.exists()) {
      const seed = emptySnapshot()
      await setDoc(this.userRef(), {
        profile: seed.profile,
        gamification: seed.gamification,
        workStats: seed.workStats,
        cycle: seed.cycle,
      })
      await Promise.all(
        seed.categories.map((c) => setDoc(this.itemRef('categories', c.id), c)),
      )
      return seed
    }

    const data = userSnap.data()
    const [accSnap, catSnap, movSnap, tokSnap, remSnap, notSnap] = await Promise.all([
      getDocs(this.coll('accounts')),
      getDocs(this.coll('categories')),
      getDocs(this.coll('movements')),
      getDocs(this.coll('tokenEntries')),
      getDocs(this.coll('reminders')),
      getDocs(this.coll('notes')),
    ])

    return {
      profile: { ...defaultProfile(), ...(data.profile as Partial<Profile>) },
      gamification: { ...defaultGamification(), ...(data.gamification as Partial<Gamification>) },
      workStats: { ...defaultWorkStats(), ...(data.workStats as Partial<WorkStats>) },
      accounts: accSnap.docs.map((d) => d.data() as Account),
      categories: catSnap.docs.map((d) => d.data() as Category),
      movements: movSnap.docs.map((d) => d.data() as Movement),
      tokenEntries: tokSnap.docs.map((d) => d.data() as TokenEntry),
      reminders: remSnap.docs.map((d) => d.data() as PaymentReminder),
      notes: notSnap.docs.map((d) => d.data() as Note),
      cycle: { ...defaultCycle(), ...(data.cycle as Partial<Cycle>) },
    }
  }

  async saveProfile(profile: Profile): Promise<void> {
    await setDoc(this.userRef(), { profile }, { merge: true })
  }

  async saveGamification(gamification: Gamification): Promise<void> {
    await setDoc(this.userRef(), { gamification }, { merge: true })
  }

  async upsertAccount(account: Account): Promise<void> {
    await setDoc(this.itemRef('accounts', account.id), sanitize(account))
  }
  async removeAccount(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('accounts', id))
  }

  async upsertCategory(category: Category): Promise<void> {
    await setDoc(this.itemRef('categories', category.id), category)
  }
  async removeCategory(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('categories', id))
  }

  async upsertMovement(movement: Movement): Promise<void> {
    await setDoc(this.itemRef('movements', movement.id), sanitize(movement))
  }
  async removeMovement(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('movements', id))
  }

  async upsertTokenEntry(entry: TokenEntry): Promise<void> {
    await setDoc(this.itemRef('tokenEntries', entry.id), sanitize(entry))
  }
  async removeTokenEntry(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('tokenEntries', id))
  }
  async saveWorkStats(workStats: WorkStats): Promise<void> {
    await setDoc(this.userRef(), { workStats }, { merge: true })
  }

  async upsertReminder(reminder: PaymentReminder): Promise<void> {
    await setDoc(this.itemRef('reminders', reminder.id), sanitize(reminder))
  }
  async removeReminder(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('reminders', id))
  }

  async upsertNote(note: Note): Promise<void> {
    await setDoc(this.itemRef('notes', note.id), sanitize(note))
  }
  async removeNote(id: ID): Promise<void> {
    await deleteDoc(this.itemRef('notes', id))
  }

  async saveCycle(cycle: Cycle): Promise<void> {
    // JSON round-trip: quita cualquier `undefined` anidado (Firestore lo rechaza).
    const clean = JSON.parse(JSON.stringify(cycle))
    await setDoc(this.userRef(), { cycle: clean }, { merge: true })
  }

  async reset(): Promise<void> {
    const seed = emptySnapshot()
    const [accSnap, catSnap, movSnap, tokSnap, remSnap, notSnap] = await Promise.all([
      getDocs(this.coll('accounts')),
      getDocs(this.coll('categories')),
      getDocs(this.coll('movements')),
      getDocs(this.coll('tokenEntries')),
      getDocs(this.coll('reminders')),
      getDocs(this.coll('notes')),
    ])
    await Promise.all([
      ...accSnap.docs.map((d) => deleteDoc(d.ref)),
      ...catSnap.docs.map((d) => deleteDoc(d.ref)),
      ...movSnap.docs.map((d) => deleteDoc(d.ref)),
      ...tokSnap.docs.map((d) => deleteDoc(d.ref)),
      ...remSnap.docs.map((d) => deleteDoc(d.ref)),
      ...notSnap.docs.map((d) => deleteDoc(d.ref)),
    ])
    await setDoc(this.userRef(), {
      profile: seed.profile,
      gamification: seed.gamification,
      workStats: seed.workStats,
    })
    await Promise.all(
      seed.categories.map((c) => setDoc(this.itemRef('categories', c.id), c)),
    )
  }
}

/** Firestore no acepta `undefined`: quita esas claves antes de escribir. */
function sanitize<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}
