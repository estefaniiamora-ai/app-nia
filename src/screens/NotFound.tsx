import { useNavigate } from 'react-router-dom'
import ErrorScreen from '../components/ErrorScreen'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <ErrorScreen
      code="404"
      mood="sad"
      speech="¿mm? 🐾"
      title="Página no encontrada"
      message="El michi buscó por todos lados y no la encontró. Volvamos a casa. 🏠"
      actionLabel="Volver al inicio"
      onAction={() => navigate('/')}
    />
  )
}
