import { Component, type ReactNode } from 'react'
import ErrorScreen from './ErrorScreen'

interface State {
  hasError: boolean
}

/** Atrapa errores inesperados de React y muestra la pantalla del gatito
 *  en vez de una pantalla en blanco. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Nia · error atrapado:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          mood="sad"
          speech="¿uy? 🙀"
          title="¡Algo se enredó!"
          message="Tranquila, no perdiste nada. Recarga y seguimos donde íbamos. 💗"
          actionLabel="Recargar"
          onAction={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
