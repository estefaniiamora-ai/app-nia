import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './config'

type AuthStatus = 'loading' | 'in' | 'out'

interface AuthValue {
  user: User | null
  status: AuthStatus
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Persistencia en localStorage (clave para PWAs instaladas en iOS).
    setPersistence(auth, browserLocalPersistence).catch(() => {})
    // Por si veníamos de un login por redirect.
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setStatus(u ? 'in' : 'out')
    })
    return unsub
  }, [])

  async function signIn() {
    setError(null)
    try {
      // Popup primero (rápido en escritorio/Android)…
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? ''
      // …con fallback a redirect (PWA iOS, popups bloqueados).
      if (
        code.includes('popup-blocked') ||
        code.includes('popup-closed-by-user') ||
        code.includes('operation-not-supported') ||
        code.includes('cancelled-popup-request')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch {
          setError('No se pudo iniciar sesión. Intenta de nuevo.')
        }
      } else {
        setError('No se pudo iniciar sesión. Intenta de nuevo.')
      }
    }
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, status, error, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
