import { useEffect, useState } from 'react'
import './InstallPrompt.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIos, setShowIos] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true
    if (isStandalone) return
    if (sessionStorage.getItem('pwa-install-dismissed')) return

    const ua = navigator.userAgent
    const isIos = /ipad|iphone|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)

    if (isIos && isSafari) {
      const t = window.setTimeout(() => setShowIos(true), 4000)
      return () => window.clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
      setDeferred(null)
    }
  }

  function dismiss() {
    setShowAndroid(false)
    setShowIos(false)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!showAndroid && !showIos) return null

  return (
    <div className="ip-overlay" role="dialog" aria-modal="true" onClick={dismiss}>
      <div className="ip-card" onClick={(e) => e.stopPropagation()}>
        <img src="/LOGO.png" alt="Nia" className="ip-logo" />
        <h3 className="ip-title">Instala Nia 💜</h3>

        {showAndroid && (
          <>
            <p className="ip-desc">
              Agrégala a tu pantalla de inicio para entrar más rápido, como una app de verdad.
            </p>
            <button className="btn btn--primary btn--block" onClick={install}>
              Instalar app
            </button>
            <button className="btn btn--ghost btn--block" onClick={dismiss}>
              Ahora no
            </button>
          </>
        )}

        {showIos && (
          <>
            <p className="ip-desc">Para instalarla en tu iPhone, en Safari:</p>
            <ol className="ip-steps">
              <li>
                <span className="ip-num">1</span>
                <span>
                  Toca <strong>Compartir</strong> <span className="ip-ic">􀈂</span> abajo
                </span>
              </li>
              <li>
                <span className="ip-num">2</span>
                <span>
                  Elige <strong>"Añadir a pantalla de inicio"</strong> <span className="ip-ic">＋</span>
                </span>
              </li>
              <li>
                <span className="ip-num">3</span>
                <span>
                  Toca <strong>"Añadir"</strong> ✨
                </span>
              </li>
            </ol>
            <button className="btn btn--ghost btn--block" onClick={dismiss}>
              Entendido 💕
            </button>
          </>
        )}
      </div>
    </div>
  )
}
