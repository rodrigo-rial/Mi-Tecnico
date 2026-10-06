import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import SolicitudForm from '../components/solicitudes/SolicitudForm'
import { cargarCatalogos } from '../services/catalogos'
import { crearSolicitud } from '../services/solicitudesApi'
import { mensajeError } from '../utils/errores'
import { ENLACES_CLIENTE } from '../utils/navegacion'

function NuevaSolicitudPage() {
  const navigate = useNavigate()

  const [catalogos, setCatalogos] = useState({ especialidades: [], zonas: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let pantallaActiva = true

    cargarCatalogos()
      .then((datos) => {
        if (!pantallaActiva) return
        setCatalogos(datos)
        setError('')
      })
      .catch((errorCarga) => {
        if (!pantallaActiva) return
        if (errorCarga.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(mensajeError(errorCarga))
      })
      .finally(() => {
        if (pantallaActiva) setCargando(false)
      })

    return () => {
      pantallaActiva = false
    }
  }, [intento, navigate])

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((valor) => valor + 1)
  }

  async function publicar(datos) {
    await crearSolicitud(datos)
    navigate('/cliente/solicitudes', {
      state: {
        mensaje: 'Tu solicitud fue publicada. Los técnicos compatibles ya pueden verla.',
      },
    })
  }

  return (
    <LayoutPagina
      titulo="Nueva solicitud"
      descripcion="Contanos qué necesitás y los técnicos de tu zona te enviarán propuestas."
      enlaces={ENLACES_CLIENTE}
    >
      {cargando && <Spinner texto="Cargando el formulario..." />}

      {!cargando && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && (
        <SolicitudForm
          especialidades={catalogos.especialidades}
          zonas={catalogos.zonas}
          onGuardar={publicar}
        />
      )}
    </LayoutPagina>
  )
}

export default NuevaSolicitudPage
