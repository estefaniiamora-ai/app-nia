import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)

// Registrar el service worker solo en producción.
// updateViaCache:'none' + reg.update() al cargar y al volver a la app =
// se detecta y queda lista la versión nueva sin reinstalar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update()
        // revisar actualizaciones cada vez que la app vuelve a primer plano
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update()
        })
      })
      .catch(() => {})
  })
}
