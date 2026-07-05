import { useState } from 'react'
import { useAuth } from '../firebase/AuthProvider'
import Cat from '../components/Cat/Cat'
import './Login.css'

export default function Login() {
  const { signIn, error } = useAuth()
  const [busy, setBusy] = useState(false)

  async function handle() {
    setBusy(true)
    await signIn()
    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login__card">
        <Cat size={150} mood="happy" alive speech="¡Holaaa! 🪻" />
        <h1 className="login__title">Nia</h1>
        <p className="login__sub">Tus cuentas, bonitas y al día 💜</p>

        <button className="gbtn" onClick={handle} disabled={busy}>
          <GoogleIcon />
          {busy ? 'Entrando…' : 'Entrar con Google'}
        </button>

        {error && <p className="login__error">{error}</p>}

        <p className="login__legal">
          Tus datos quedan guardados de forma privada y segura, solo para ti.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5 16 5 9.1 9.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C39.9 35.6 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}
