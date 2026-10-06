import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import Badge from '../components/comunes/Badge'
import AvisoVerificacion from '../components/solicitudes/AvisoVerificacion'
import PropuestaForm from '../components/solicitudes/PropuestaForm'
import SolicitudCard from '../components/solicitudes/SolicitudCard'
import { obtenerEstadoValidacion } from '../services/estadoTecnico'
import { listarMisPropuestas } from '../services/propuestasApi'
import { enviarPropuesta, listarSolicitudes } from '../services/solicitudesApi'
import { mensajeError } from '../utils/errores'
import { formatearDinero } from '../utils/formato'
import { ENLACES_TECNICO } from '../utils/navegacion'

const FILTROS = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'urgentes', texto: 'Urgentes' },
]

async function pedirDatos() {
  // Estado y propuestas propias son complementarios: si fallan, el feed igual
  // se muestra (un técnico sin aprobar recibe 403 en "mis propuestas").
  const [solicitudes, estado, propuestas] = await Promise.all([
    listarSolicitudes(),
    obtenerEstadoValidacion().catch(() => undefined),
    listarMisPropuestas().catch(() => []),
  ])

  return { solicitudes, estado, propuestas }
}

function SolicitudesTecnicoPage() {
  const navigate = useNavigate()

  const [solicitudes, setSolicitudes] = useState([])
  const [estado, setEstado] = useState(undefined)
  const [propuestasPorSolicitud, setPropuestasPorSolicitud] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState('todas')
  const [formAbierto, setFormAbierto] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let pantallaActiva = true

    pedirDatos()
      .then((datos) => {
        if (!pantallaActiva) return
        setSolicitudes(datos.solicitudes)
        setEstado(datos.estado)
        setPropuestasPorSolicitud(
          Object.fromEntries(datos.propuestas.map((p) => [p.solicitud, p])),
        )
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

  function actualizar() {
    setCargando(true)
    setError('')
    setFormAbierto(null)
    setIntento((valor) => valor + 1)
  }

  async function enviar(solicitudId, datos) {
    const propuesta = await enviarPropuesta(solicitudId, datos)
    setPropuestasPorSolicitud((actuales) => ({ ...actuales, [solicitudId]: propuesta }))
    setFormAbierto(null)
    setAviso('Tu propuesta fue enviada. El cliente la va a revisar.')
  }

  const visibles =
    filtro === 'urgentes' ? solicitudes.filter((s) => s.es_urgente) : solicitudes
  const verificado = estado === undefined || estado === 'APROBADO'

  return (
    <LayoutPagina
      titulo="Solicitudes para vos"
      descripcion="Pedidos publicados de tu especialidad y de tus zonas de cobertura."
      enlaces={ENLACES_TECNICO}
      conCerrarSesion
    >
      <AvisoVerificacion estado={estado} />

      {aviso && (
        <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-800">
          {aviso}
        </p>
      )}

      {cargando && <Spinner texto="Buscando solicitudes..." />}

      {!cargando && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={actualizar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && solicitudes.length === 0 && verificado && (
        <EstadoVacio
          titulo="No hay solicitudes compatibles por ahora"
          descripcion="Solo ves solicitudes publicadas de tu especialidad y de tus zonas de cobertura. Volvé a revisar más tarde."
        >
          <button type="button" onClick={actualizar} className="mt-button">
            Actualizar
          </button>
        </EstadoVacio>
      )}

      {!cargando && !error && solicitudes.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Filtrar solicitudes" className="flex flex-wrap gap-2">
              {FILTROS.map(({ valor, texto }) => (
                <button
                  key={valor}
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
            <button
              type="button"
              onClick={actualizar}
              className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-brand hover:underline sm:ml-auto"
            >
              Actualizar
            </button>
          </div>

          {visibles.length === 0 ? (
            <EstadoVacio
              titulo="No hay solicitudes urgentes"
              descripcion="Probá con el filtro «Todas»."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibles.map((solicitud) => {
                const enviada = propuestasPorSolicitud[solicitud.id]

                return (
                  <SolicitudCard key={solicitud.id} solicitud={solicitud} conEnlace={false}>
                    {enviada && (
                      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-canvas p-3">
                        <Badge estado={enviada.estado} texto="Propuesta enviada" />
                        <span className="text-sm text-ink">
                          Tu precio: <strong>{formatearDinero(enviada.precio)}</strong>
                        </span>
                      </div>
                    )}

                    {!enviada && formAbierto === solicitud.id && (
                      <PropuestaForm
                        onEnviar={(datos) => enviar(solicitud.id, datos)}
                        onCancelar={() => setFormAbierto(null)}
                      />
                    )}

                    {!enviada && formAbierto !== solicitud.id && (
                      <button
                        type="button"
                        aria-label={`Enviar propuesta para ${solicitud.titulo}`}
                        onClick={() => {
                          setAviso('')
                          setFormAbierto(solicitud.id)
                        }}
                        className="mt-button w-full sm:w-auto"
                      >
                        Enviar propuesta
                      </button>
                    )}
                  </SolicitudCard>
                )
              })}
            </div>
          )}
        </>
      )}
    </LayoutPagina>
  )
}

export default SolicitudesTecnicoPage
