import { useEffect, useMemo } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store/store'
import { AuthProvider, useAuth } from './firebase/AuthProvider'
import { FirebaseProvider } from './data/firebaseProvider'
import Layout from './components/Layout'
import Home from './screens/Home'
import Movements from './screens/Movements'
import Accounts from './screens/Accounts'
import Settings from './screens/Settings'
import Shop from './screens/Shop'
import Stats from './screens/Stats'
import Notes from './screens/Notes'
import Ciclo from './screens/Ciclo'
import Configuracion from './screens/Configuracion'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import NotFound from './screens/NotFound'
import InstallPrompt from './components/InstallPrompt'
import Cat from './components/Cat/Cat'
import './styles/ui.css'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

function Splash({ text }: { text: string }) {
  return (
    <div className="app" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center', opacity: 0.9 }}>
        <Cat size={120} alive={false} />
        <p className="t-soft" style={{ marginTop: 8 }}>
          {text}
        </p>
      </div>
    </div>
  )
}

function AuthGate() {
  const { user, status } = useAuth()
  if (status === 'loading') return <Splash text="Abriendo Nia…" />
  if (!user) return <Login />
  return <SignedInApp uid={user.uid} />
}

function SignedInApp({ uid }: { uid: string }) {
  const provider = useMemo(() => new FirebaseProvider(uid), [uid])
  return (
    <AppProvider key={uid} dataProvider={provider}>
      <ThemedApp />
    </AppProvider>
  )
}

function ThemedApp() {
  const { profile, loading } = useApp()

  // Aplica el tema (claro / oscuro / automático) al <html>
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      let theme = profile.theme
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      root.dataset.theme = theme
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#201b33' : '#d9c9ff')
    }
    apply()
    if (profile.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [profile.theme])

  if (loading) return <Splash text="Cargando tus cuentas…" />

  return (
    <>
      {!profile.onboarded ? (
        <Onboarding />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/movimientos" element={<Movements />} />
            <Route path="/cuentas" element={<Accounts />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/tienda" element={<Shop />} />
            <Route path="/estadisticas" element={<Stats />} />
            <Route path="/notas" element={<Notes />} />
            <Route path="/ciclo" element={<Ciclo />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
      <InstallPrompt />
    </>
  )
}
