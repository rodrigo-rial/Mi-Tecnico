import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Badge from '../components/comunes/Badge'
import { solicitarAutenticado, extraerLista } from '../services/http'
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
    if (!usuario) return
    let pantallaActiva = true

    Promise.all([
      listarTrabajos(),
      usuario.rol === 'CLIENTE' ? solicitarAutenticado('/urgencias/').then(extraerLista) : Promise.resolve([]),
    ])
      .then(([datos, urgencias]) => {
        if (!pantallaActiva) return
        const asignados = new Set(urgencias.flatMap((u) => u.asignaciones.map((a) => String(a.trabajo))))
        const servicios = [
          ...datos.filter((t) => !asignados.has(String(t.id))),
          ...urgencias.map((u) => ({
            ...u,
            id: `urgencia-${u.id}`,
            urgenciaId: u.id,
            created_at: u.creada_en,
            estado: u.estado === 'cancelada' ? 'cancelado'
              : u.estado === 'finalizada' ? 'finalizado'
                : u.estado === 'asignada' && u.asignaciones.some((a) => a.estado === 'en_proceso') ? 'en_proceso' : 'pendiente',
            buscando: u.estado === 'buscando',
          })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setTrabajos(servicios)
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
  }, [intento, navigate, usuario])

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
      titulo={rol === 'CLIENTE' ? 'Servicios contratados' : 'Mis trabajos'}
      descripcion="Los servicios acordados entre clientes y técnicos."
      enlaces={enlacesPorRol(rol)}
      conCerrarSesion
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
          titulo={rol === 'CLIENTE' ? 'Todavía no contrataste servicios' : 'Todavía no tenés trabajos'}
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
                trabajo.urgenciaId ? <article key={trabajo.id} className="mt-card space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="text-lg font-semibold">Urgencia: {trabajo.especialidad_nombre}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge texto="Urgente" tono="error" />
                      <Badge estado={trabajo.estado} texto={trabajo.buscando ? 'Buscando técnico' : undefined} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{trabajo.zona_nombre}</p>
                  <p>{trabajo.descripcion}</p>
                  <p className="text-sm">Visita: $40.000 · Adicionales a acordar</p>
                  <Link className="text-brand font-semibold" to={`/cliente/urgencias?id=${trabajo.urgenciaId}`}>Ver seguimiento</Link>
                </article> : <TrabajoCard key={trabajo.id} trabajo={trabajo} />
              ))}
            </div>
          )}
        </>
      )}
    </LayoutPagina>
  )
}

export default MisTrabajosPage
