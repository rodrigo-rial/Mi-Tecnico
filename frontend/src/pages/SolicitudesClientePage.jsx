import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import SolicitudCard from '../components/solicitudes/SolicitudCard'
import { listarSolicitudes } from '../services/solicitudesApi'
import { mensajeError } from '../utils/errores'
import { ENLACES_CLIENTE } from '../utils/navegacion'

const FILTROS = [
  { valor: '', texto: 'Todas' },
  { valor: 'publicada', texto: 'Publicadas' },
  { valor: 'asignada', texto: 'Asignadas' },
  { valor: 'finalizada', texto: 'Finalizadas' },
  { valor: 'cancelada', texto: 'Canceladas' },
]

const CLASE_BOTON_ENLACE =
  'mt-button inline-flex items-center justify-center'

function SolicitudesClientePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState('')
  const [aviso] = useState(location.state?.mensaje ?? '')

  // El aviso viene en el estado de la navegación: se limpia para que no
  // reaparezca al recargar la página.
  useEffect(() => {
    if (location.state?.mensaje) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    let pantallaActiva = true

    listarSolicitudes()
      .then((datos) => {
        if (!pantallaActiva) return
        setSolicitudes(datos)
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

  const visibles = filtro
    ? solicitudes.filter((solicitud) => solicitud.estado === filtro)
    : solicitudes

  return (
    <LayoutPagina
      titulo="Mis solicitudes"
      descripcion="Seguí el estado de los servicios que publicaste."
      enlaces={ENLACES_CLIENTE}
    >
      {aviso && (
        <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-800">
          {aviso}
        </p>
      )}

      {cargando && <Spinner texto="Cargando tus solicitudes..." />}

      {!cargando && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && solicitudes.length === 0 && (
        <EstadoVacio
          titulo="Todavía no publicaste solicitudes"
          descripcion="Publicá la primera y recibí propuestas de técnicos verificados."
        >
          <Link to="/cliente/solicitudes/nueva" className={CLASE_BOTON_ENLACE}>
            Publicar solicitud
          </Link>
        </EstadoVacio>
      )}

      {!cargando && !error && solicitudes.length > 0 && (
        <>
          <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
            {FILTROS.map(({ valor, texto }) => (
              <button
                key={texto}
                type="button"
                aria-pressed={filtro === valor}
                onClick={() => setFiltro(valor)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  filtro === valor
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-surface text-ink hover:bg-canvas'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <EstadoVacio
              titulo="No hay solicitudes con ese estado"
              descripcion="Probá con otro filtro."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibles.map((solicitud) => (
                <SolicitudCard key={solicitud.id} solicitud={solicitud} />
              ))}
            </div>
          )}
        </>
      )}
    </LayoutPagina>
  )
}

export default SolicitudesClientePage
