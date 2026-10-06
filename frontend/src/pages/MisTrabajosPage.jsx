import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import TrabajoCard from '../components/trabajos/TrabajoCard'
import { useUsuarioActual } from '../hooks/useUsuarioActual'
import { listarTrabajos } from '../services/trabajosApi'
import { mensajeError } from '../utils/errores'
import { enlacesPorRol } from '../utils/navegacion'

const FILTROS = [
  { valor: '', texto: 'Todos' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'en_proceso', texto: 'En proceso' },
  { valor: 'finalizado', texto: 'Finalizados' },
  { valor: 'cancelado', texto: 'Cancelados' },
]

function MisTrabajosPage() {
  const navigate = useNavigate()
  const { usuario, cargando: cargandoUsuario } = useUsuarioActual()

  const [trabajos, setTrabajos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    if (!cargandoUsuario && !usuario) navigate('/login', { replace: true })
  }, [cargandoUsuario, usuario, navigate])

  useEffect(() => {
    let pantallaActiva = true

    listarTrabajos()
      .then((datos) => {
        if (!pantallaActiva) return
        setTrabajos(datos)
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

  const rol = usuario?.rol
  const enCarga = cargando || cargandoUsuario
  const visibles = filtro ? trabajos.filter((t) => t.estado === filtro) : trabajos

  return (
    <LayoutPagina
      titulo="Mis trabajos"
      descripcion="Los servicios acordados entre clientes y técnicos."
      enlaces={enlacesPorRol(rol)}
      conCerrarSesion={rol === 'TECNICO'}
    >
      {enCarga && <Spinner texto="Cargando tus trabajos..." />}

      {!enCarga && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!enCarga && !error && trabajos.length === 0 && (
        <EstadoVacio
          titulo="Todavía no tenés trabajos"
          descripcion={
            rol === 'TECNICO'
              ? 'Cuando un cliente acepte una de tus propuestas, el trabajo aparece acá.'
              : 'Cuando aceptes una propuesta, el trabajo aparece acá.'
          }
        />
      )}

      {!enCarga && !error && trabajos.length > 0 && (
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
              titulo="No hay trabajos con ese estado"
              descripcion="Probá con otro filtro."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibles.map((trabajo) => (
                <TrabajoCard key={trabajo.id} trabajo={trabajo} />
              ))}
            </div>
          )}
        </>
      )}
    </LayoutPagina>
  )
}

export default MisTrabajosPage
