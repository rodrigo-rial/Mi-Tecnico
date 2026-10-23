import { Navigate } from 'react-router-dom'

// Conserva los enlaces anteriores hacia la cuenta unificada.
export default function PanelTecnicoToken() {
  return <Navigate to="/cuenta" replace />
}
