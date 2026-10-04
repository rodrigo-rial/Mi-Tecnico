import { useNavigate } from 'react-router-dom'

import PanelTecnico from './PanelTecnico'
import {
  cerrarSesion,
  obtenerAccessToken,
} from '../services/authApi'

function PanelTecnicoToken() {
  const navigate = useNavigate()
  const token = obtenerAccessToken()

  function manejarCierreSesion() {
    cerrarSesion()
    navigate('/login', { replace: true })
  }
  return (
    <>
      <div className="bg-slate-100 px-4 pt-4 text-right">
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