import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { ENLACES_CLIENTE } from '../utils/navegacion'
import { solicitarAutenticado, extraerLista } from '../services/http'

const estados = {
  buscando: 'Buscando técnico',
  asignada: 'Técnico asignado',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
}

export default function UrgenciasPage() {
  const [parametros, setParametros] = useSearchParams()
  const pedidoId = parametros.get('id')
  const [pedidos, setPedidos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [zonas, setZonas] = useState([])
  const [datos, setDatos] = useState({ especialidad: '', zona: '', direccion: '', descripcion: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [cancelarId, setCancelarId] = useState(null)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let activo = true
    let timer
    async function consultar() {
      try {
        const lista = await solicitarAutenticado('/urgencias/')
        if (activo) {
          setPedidos(lista)
        }
      } catch (e) {
        if (activo) setError(e.message)
      } finally {
        if (activo) {
          setCargando(false)
          timer = setTimeout(consultar, 5000)
        }
      }
    }
    consultar()
    Promise.all([
      solicitarAutenticado('/tecnicos/especialidades/'),
      solicitarAutenticado('/tecnicos/zonas/'),
    ])
      .then(([e, z]) => {
        if (activo) {
          setEspecialidades(extraerLista(e))
          setZonas(extraerLista(z))
        }
      })
      .catch((e) => {
        if (activo) setError(e.message)
      })
    return () => {
      activo = false
      clearTimeout(timer)
    }
  }, [intento])
  const pendiente = pedidos.find((p) => ['buscando', 'asignada'].includes(p.estado))
  const seleccionado = pedidoId ? pedidos.find((p) => String(p.id) === pedidoId) : pendiente
  const visibles = seleccionado ? [seleccionado] : []
  const campo = (event) => setDatos({ ...datos, [event.target.name]: event.target.value })
  async function pedir(event) {
    event.preventDefault()
    if (enviando) return
    setEnviando(true)
    setError('')
    try {
      const nuevo = await solicitarAutenticado('/urgencias/', { method: 'POST', datos })
      setPedidos((prev) => [nuevo, ...prev.filter((p) => p.id !== nuevo.id)])
      setParametros({ id: String(nuevo.id) })
      setIntento((v) => v + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }
  async function cancelar(id) {
    setEnviando(true)
    setError('')
    try {
      const actualizado = await solicitarAutenticado(`/urgencias/${id}/cancelar/`, {
        method: 'POST',
      })
      setPedidos((prev) => prev.map((p) => (p.id === id ? actualizado : p)))
      setCancelarId(null)
      setIntento((v) => v + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }
  return (
    <LayoutPagina titulo="Atención urgente" enlaces={ENLACES_CLIENTE}>
      <Link to="/trabajos" className="text-brand">
        ← Servicios contratados
      </Link>
      {!pedidoId && !pendiente && (
        <section className="mt-card space-y-3">
          <h2 className="text-xl font-bold">Visita urgente · $40.000</h2>
          <p>Asignación automática a un técnico aprobado, disponible y de tu zona.</p>
          <p className="text-sm text-slate-600">
            La visita cuesta $40.000. Reparaciones y materiales adicionales se acuerdan aparte con
            el técnico. El pago se realiza fuera de MiTécnico.
          </p>
        </section>
      )}
      {error && (
        <div role="alert" className="mt-card text-red-700">
          {error}{' '}
          <button type="button" className="underline" onClick={() => setIntento((v) => v + 1)}>
            Actualizar
          </button>
        </div>
      )}
      {cargando && <p role="status">Cargando urgencias…</p>}
      {!cargando && !pedidoId && !pendiente && (
        <form className="mt-card space-y-4" onSubmit={pedir}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Especialidad
              <select
                name="especialidad"
                required
                value={datos.especialidad}
                onChange={campo}
                className="mt-input"
              >
                <option value="">Seleccioná un servicio</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Zona
              <select name="zona" required value={datos.zona} onChange={campo} className="mt-input">
                <option value="">Seleccioná tu zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            Dirección
            <input
              name="direccion"
              required
              maxLength={255}
              value={datos.direccion}
              onChange={campo}
              className="mt-input"
              autoComplete="street-address"
            />
          </label>
          <label className="block">
            ¿Qué pasó?
            <textarea
              name="descripcion"
              required
              maxLength={2000}
              value={datos.descripcion}
              onChange={campo}
              className="mt-input"
              rows={3}
            />
          </label>
          <p className="text-sm">
            Al confirmar, autorizás la asignación automática con esta tarifa de visita. Si el
            técnico cancela, buscaremos otro sin que tengas que repetir el pedido.
          </p>
          <button
            className="mt-button"
            disabled={enviando || !especialidades.length || !zonas.length}
          >
            {enviando ? 'Buscando…' : 'Confirmar visita de $40.000'}
          </button>
        </form>
      )}
      {!cargando && pedidoId && !seleccionado && !error && (
        <p role="status">No encontramos esa urgencia en tu cuenta.</p>
      )}
      {visibles.map((p) => (
        <section className="mt-card space-y-3" key={p.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-bold text-lg">
              {p.especialidad_nombre} · {p.zona_nombre}
            </h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900">
              {estados[p.estado]}
            </span>
          </div>
          <p>{p.descripcion}</p>
          <p className="text-sm text-slate-600">{p.direccion}</p>
          {p.estado === 'buscando' && (
            <p role="status">
              Estamos buscando un técnico disponible en tu zona. La búsqueda continúa aunque cierres
              esta pantalla.
            </p>
          )}
          {p.asignaciones.map((a, i) => (
            <div
              key={a.trabajo}
              className="rounded-lg bg-slate-50 p-3 flex flex-wrap gap-3 justify-between"
            >
              <span>
                {a.tecnico} ·{' '}
                {a.estado === 'cancelado'
                  ? 'Visita cancelada'
                  : a.estado === 'en_proceso'
                    ? 'En proceso'
                    : a.estado === 'finalizado'
                      ? 'Finalizado'
                      : 'Esperando validación del código'}
              </span>
              <Link to={`/trabajos/${a.trabajo}`} className="text-brand font-semibold">
                {i === 0 && p.estado === 'asignada' ? 'Ver trabajo y código' : 'Ver detalle'}
              </Link>
            </div>
          ))}
          {['buscando', 'asignada'].includes(p.estado) &&
            (cancelarId === p.id ? (
              <div className="space-y-2">
                <p>¿Cancelar la urgencia y detener la búsqueda de técnicos?</p>
                <button
                  type="button"
                  disabled={enviando}
                  className="mt-button mr-3"
                  onClick={() => cancelar(p.id)}
                >
                  Sí, cancelar urgencia
                </button>
                <button type="button" onClick={() => setCancelarId(null)}>
                  Volver
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-red-700 underline"
                onClick={() => setCancelarId(p.id)}
              >
                Cancelar urgencia
              </button>
            ))}
        </section>
      ))}
    </LayoutPagina>
  )
}
