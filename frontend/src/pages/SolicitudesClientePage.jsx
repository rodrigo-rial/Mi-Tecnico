import Badge from '../components/comunes/Badge'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import SolicitudCard from '../components/solicitudes/SolicitudCard'
import { solicitarAutenticado } from '../services/http'
import { listarSolicitudes } from '../services/solicitudesApi'
import { mensajeError } from '../utils/errores'
import { ENLACES_CLIENTE } from '../utils/navegacion'

const FILTROS = [
  { valor: '', texto: 'Todas' },
  { valor: 'buscando', texto: 'Buscando técnico' },
  { valor: 'publicada', texto: 'Publicadas' },
  { valor: 'asignada', texto: 'Asignadas' },
  { valor: 'finalizada', texto: 'Finalizadas' },
  { valor: 'cancelada', texto: 'Canceladas' },
]

function SolicitudesClientePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
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

    let timer
    async function cargar() {
      try {
        const [normales, urgencias] = await Promise.all([listarSolicitudes(), solicitarAutenticado('/urgencias/')])
        // Los intentos de asignación pertenecen a un solo pedido urgente.
        const intentos = new Set(urgencias.flatMap((u) => u.asignaciones.map((a) => a.solicitud)))
        const datos = [
          ...normales.filter((s) => !intentos.has(s.id)),
          ...urgencias.map((u) => ({ ...u, id: `urgencia-${u.id}`, urgencia: true,
            titulo: `Urgencia: ${u.especialidad_nombre}`, created_at: u.creada_en })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        if (!pantallaActiva) return
        setSolicitudes(datos)
        setError('')
      } catch (errorCarga) {
        if (!pantallaActiva) return
        if (errorCarga.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(mensajeError(errorCarga))
      } finally {
        if (pantallaActiva) {
          setCargando(false)
          timer = setTimeout(cargar, 5000)
        }
      }
    }
    cargar()
    return () => {
      pantallaActiva = false
      clearTimeout(timer)
    }
  }, [intento, navigate])

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((valor) => valor + 1)
  }

  const normalizar = (valor) => (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibles = solicitudes.filter((solicitud) =>
    (!filtro || solicitud.estado === filtro) &&
    normalizar([solicitud.titulo, solicitud.especialidad_nombre, solicitud.zona_nombre].join(' ')).includes(normalizar(busqueda.trim())))

  return (
    <LayoutPagina
      titulo="Mis solicitudes"
      descripcion="Seguí el estado de los servicios que publicaste."
      enlaces={ENLACES_CLIENTE}
    >
      <div className="client-action-row flex-wrap gap-3"><Link className="mt-button inline-flex items-center gap-3" to="/cliente/solicitudes/nueva"><span aria-hidden="true">+</span> Nueva solicitud</Link></div>
      {!cargando && !error && <div className="activity-summary" aria-label="Resumen de solicitudes">{[{ valor: 'buscando', texto: 'Buscando técnico' }, { valor: 'publicada', texto: 'Esperando propuestas' }, { valor: 'asignada', texto: 'Servicios coordinados' }, { valor: 'finalizada', texto: 'Solicitudes finalizadas' }].map(({ valor, texto }) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)} className={filtro === valor ? 'summary-active' : ''}><strong>{solicitudes.filter((solicitud) => solicitud.estado === valor).length}</strong><span>{texto}</span><span aria-hidden="true">↗</span></button>)}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Solicitudes</h2><Link className="text-brand text-sm font-semibold" to="/trabajos">Ver servicios contratados →</Link></div>
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
        />
      )}

      {!cargando && !error && solicitudes.length > 0 && (
        <>
          <label className="block text-sm font-medium">Buscar en mis solicitudes<input type="search" className="mt-input" placeholder="Por título, servicio o zona" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></label>
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
              titulo="No encontramos solicitudes con esos filtros"
              descripcion="Probá con otro estado o cambiá el texto de búsqueda."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibles.map((solicitud) => (
                solicitud.urgencia ? <section key={solicitud.id} className="mt-card space-y-3">
                  <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-lg">{solicitud.titulo}</h3><div className="flex flex-wrap justify-end gap-2"><Badge texto="Urgente" tono="error" /><Badge estado={solicitud.estado === 'buscando' ? 'pendiente' : solicitud.estado} texto={{ buscando: 'Buscando técnico', asignada: 'Técnico asignado', finalizada: 'Finalizada', cancelada: 'Cancelada' }[solicitud.estado]} /></div></div>
                  <p className="text-sm text-slate-600">{solicitud.zona_nombre}</p>
                  <p>{solicitud.descripcion}</p>
                  <p className="text-sm">Visita: $40.000 · Adicionales a acordar</p>
                  <Link className="text-brand font-semibold" to={`/cliente/urgencias?id=${String(solicitud.id).replace("urgencia-", "")}`}>Ver seguimiento de la urgencia →</Link>
                </section> : <SolicitudCard key={solicitud.id} solicitud={solicitud} />
              ))}
            </div>
          )}
        </>
      )}
      <div className="urgency-floating-space" aria-hidden="true" />
      <Link className="urgency-floating-button" to="/cliente/urgencias" aria-label="Pedir atención urgente">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 17v-6a6 6 0 0 1 12 0v6M4 17h16v4H4zM12 1v1M3 4l2 2M21 4l-2 2" /><path d="M12 9v4" /><circle cx="12" cy="15" r=".5" fill="currentColor" /></svg>
        <span>Urgencia</span>
      </Link>
    </LayoutPagina>
  )
}

export default SolicitudesClientePage
