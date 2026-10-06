import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import AvisoVerificacion from '../components/solicitudes/AvisoVerificacion'
import MiPropuestaCard from '../components/solicitudes/MiPropuestaCard'
import { obtenerEstadoValidacion } from '../services/estadoTecnico'
import { listarMisPropuestas } from '../services/propuestasApi'
import { listarTrabajos } from '../services/trabajosApi'
import { mensajeError } from '../utils/errores'
import { ENLACES_TECNICO } from '../utils/navegacion'

const FILTROS = [
  { valor: '', texto: 'Todas' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'aceptada', texto: 'Aceptadas' },
  { valor: 'rechazada', texto: 'Rechazadas' },
]

async function pedirDatos() {
  const [propuestas, trabajos, estado] = await Promise.all([
    // 403: el técnico todavía no está aprobado, no es un error de carga.
    listarMisPropuestas().catch((error) => {
      if (error.status === 403) return null
      throw error
    }),
    listarTrabajos().catch(() => []),
    obtenerEstadoValidacion().catch(() => undefined),
  ])

  return { propuestas, trabajos, estado }
}

function MisPropuestasPage() {
  const navigate = useNavigate()

  const [propuestas, setPropuestas] = useState([])
  const [trabajos, setTrabajos] = useState([])
  const [estado, setEstado] = useState(undefined)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    let pantallaActiva = true

    pedirDatos()
      .then((datos) => {
        if (!pantallaActiva) return
        setSinPermiso(datos.propuestas === null)
        setPropuestas(datos.propuestas ?? [])
        setTrabajos(datos.trabajos)
        setEstado(datos.estado)
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

  const visibles = filtro ? propuestas.filter((p) => p.estado === filtro) : propuestas

  return (
    <LayoutPagina
      titulo="Mis propuestas"
      descripcion="Seguí el estado de las propuestas que enviaste."
      enlaces={ENLACES_TECNICO}
      conCerrarSesion
    >
      <AvisoVerificacion estado={sinPermiso ? (estado ?? null) : undefined} />

      {cargando && <Spinner texto="Cargando tus propuestas..." />}

      {!cargando && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && !sinPermiso && propuestas.length === 0 && (
        <EstadoVacio
          titulo="Todavía no enviaste propuestas"
          descripcion="Mirá las solicitudes compatibles y enviá tu primera propuesta."
        />
      )}

      {!cargando && !error && propuestas.length > 0 && (
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
              titulo="No hay propuestas con ese estado"
              descripcion="Probá con otro filtro."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibles.map((propuesta) => (
                <MiPropuestaCard
                  key={propuesta.id}
                  propuesta={propuesta}
                  trabajo={trabajos.find((t) => t.propuesta === propuesta.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </LayoutPagina>
  )
}

export default MisPropuestasPage
