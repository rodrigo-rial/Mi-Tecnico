import FormularioUrgencia from '../components/urgencias/FormularioUrgencia'
import SeguimientoUrgencia from '../components/urgencias/SeguimientoUrgencia'
import { formatearDinero } from '../utils/formato'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { ENLACES_CLIENTE } from '../utils/navegacion'
import { solicitarAutenticado, extraerLista } from '../services/http'

export default function UrgenciasPage() {
  const [parametros, setParametros] = useSearchParams()
  const pedidoId = parametros.get('id')
  const [pedidos, setPedidos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [zonas, setZonas] = useState([])
  const [tarifa, setTarifa] = useState(null)
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
      solicitarAutenticado('/urgencias/tarifa/'),
    ])
      .then(([e, z, condiciones]) => {
        if (activo) {
          setEspecialidades(extraerLista(e))
          setZonas(extraerLista(z))
          setTarifa(condiciones.tarifa_visita)
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
    if (enviando || tarifa === null) return
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
          <h2 className="text-xl font-bold">Visita urgente · {formatearDinero(tarifa)}</h2>
          <p>Asignación automática a un técnico aprobado, disponible y de tu zona.</p>
          <p className="text-sm text-slate-600">
            La visita cuesta {formatearDinero(tarifa)}. Reparaciones y materiales adicionales se
            acuerdan aparte con el técnico. El pago se realiza fuera de MiTécnico.
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
        <FormularioUrgencia
          datos={datos}
          especialidades={especialidades}
          zonas={zonas}
          tarifa={tarifa}
          enviando={enviando}
          onCambio={campo}
          onEnviar={pedir}
        />
      )}
      {!cargando && pedidoId && !seleccionado && !error && (
        <p role="status">No encontramos esa urgencia en tu cuenta.</p>
      )}
      {visibles.map((p) => (
        <SeguimientoUrgencia
          key={p.id}
          urgencia={p}
          enviando={enviando}
          confirmandoCancelacion={cancelarId === p.id}
          onCancelar={() => cancelar(p.id)}
          onVolver={() => setCancelarId(null)}
          onSolicitarCancelacion={() => setCancelarId(p.id)}
        />
      ))}
    </LayoutPagina>
  )
}
