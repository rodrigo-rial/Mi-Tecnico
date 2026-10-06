import { Link, useNavigate } from 'react-router-dom'

import PanelTecnico from './PanelTecnico'
import {
  cerrarSesion,
  obtenerAccessToken,
} from '../services/authApi'

const CLASE_ENLACE =
  'rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800'

function PanelTecnicoToken() {
  const navigate = useNavigate()
  const token = obtenerAccessToken()

  function manejarCierreSesion() {
    cerrarSesion()
    navigate('/login', { replace: true })
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-4 pt-4">
        <nav aria-label="Pantallas del técnico" className="flex flex-wrap gap-2">
          <Link to="/tecnico/solicitudes" className={CLASE_ENLACE}>
            Solicitudes
          </Link>
          <Link to="/tecnico/propuestas" className={CLASE_ENLACE}>
            Mis propuestas
          </Link>
          <Link to="/trabajos" className={CLASE_ENLACE}>
            Mis trabajos
          </Link>
        </nav>

        <button
          type="button"
          onClick={manejarCierreSesion}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      <PanelTecnico token={token} />
    </>
  )
}

export default PanelTecnicoToken
