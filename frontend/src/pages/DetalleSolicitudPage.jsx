import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Badge from '../components/comunes/Badge'
import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import ModalConfirmacion from '../components/comunes/ModalConfirmacion'
import Spinner from '../components/comunes/Spinner'
import PropuestaCard from '../components/solicitudes/PropuestaCard'
import SolicitudCard from '../components/solicitudes/SolicitudCard'
import { aceptarPropuesta, rechazarPropuesta } from '../services/propuestasApi'
import {
  cancelarSolicitud,
  listarPropuestasDeSolicitud,
  obtenerSolicitud,
} from '../services/solicitudesApi'
import { listarTrabajos } from '../services/trabajosApi'
import { mensajeError } from '../utils/errores'
import { formatearDinero, nombreVisible } from '../utils/formato'
import {
  ENLACES_CLIENTE,
  RUTA_SOLICITUDES_CLIENTE,
  rutaTrabajo,
} from '../utils/navegacion'

const CLASE_BOTON_ENLACE = 'mt-button inline-flex items-center justify-center'
const ORDEN_ESTADO = { aceptada: 0, pendiente: 1, rechazada: 2 }

function ordenarPropuestas(propuestas) {
  return [...propuestas].sort(
    (a, b) =>
      (ORDEN_ESTADO[a.estado] ?? 3) - (ORDEN_ESTADO[b.estado] ?? 3) ||
      Number(a.precio) - Number(b.precio),
  )
}

async function pedirDatos(id) {
  const [solicitud, propuestas] = await Promise.all([
    obtenerSolicitud(id),
    listarPropuestasDeSolicitud(id),
  ])

  // El trabajo solo existe una vez asignada la solicitud. Si no se puede
  // consultar, la pantalla sigue funcionando sin esa tarjeta.
  let trabajo = null
  if (solicitud.estado !== 'publicada') {
    try {
      const trabajos = await listarTrabajos()
      trabajo = trabajos.find((item) => item.solicitud === solicitud.id) ?? null
    } catch {
      trabajo = null
    }
  }

  return { solicitud, propuestas: ordenarPropuestas(propuestas), trabajo }
}

function datosModal(accion) {
  if (!accion) return {}

  if (accion.tipo === 'aceptar') {
    const tecnico = nombreVisible(
      accion.propuesta.tecnico_nombre,
      accion.propuesta.tecnico_username,
    )
    return {
      titulo: 'Aceptar propuesta',
      mensaje: `Vas a aceptar la propuesta de ${tecnico} por ${formatearDinero(accion.propuesta.precio)}. Las demás propuestas se rechazarán y se creará el trabajo.`,
      textoConfirmar: 'Aceptar propuesta',
      textoCancelar: 'Volver',
      peligro: false,
    }
  }

  if (accion.tipo === 'rechazar') {
    const tecnico = nombreVisible(
      accion.propuesta.tecnico_nombre,
      accion.propuesta.tecnico_username,
    )
    return {
      titulo: 'Rechazar propuesta',
      mensaje: `¿Querés rechazar la propuesta de ${tecnico}? Podés seguir esperando otras propuestas.`,
      textoConfirmar: 'Rechazar',
      textoCancelar: 'Volver',
      peligro: true,
    }
  }

  return {
    titulo: 'Cancelar solicitud',
    mensaje:
      'Si cancelás la solicitud, los técnicos ya no podrán enviarte propuestas. Esta acción no se puede deshacer.',
    textoConfirmar: 'Sí, cancelar',
    textoCancelar: 'No, volver',
    peligro: true,
  }
}

const MENSAJES_EXITO = {
  aceptar: 'Propuesta aceptada. Se creó el trabajo con el técnico elegido.',
  rechazar: 'Propuesta rechazada.',
  cancelar: 'La solicitud fue cancelada.',
}

function DetalleSolicitudPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [accion, setAccion] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  useEffect(() => {
    let pantallaActiva = true

    pedirDatos(id)
      .then((resultado) => {
        if (!pantallaActiva) return
        setDatos(resultado)
        setError(null)
      })
      .catch((errorCarga) => {
        if (!pantallaActiva) return
        if (errorCarga.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(errorCarga)
      })
      .finally(() => {
        if (pantallaActiva) setCargando(false)
      })

    return () => {
      pantallaActiva = false
    }
  }, [id, intento, navigate])

  function reintentar() {
    setCargando(true)
    setError(null)
    setIntento((valor) => valor + 1)
  }

  async function confirmarAccion() {
    const actual = accion
    setProcesando(true)
    setErrorAccion('')
    setAviso('')

    try {
      if (actual.tipo === 'aceptar') await aceptarPropuesta(actual.propuesta.id)
      if (actual.tipo === 'rechazar') await rechazarPropuesta(actual.propuesta.id)
      if (actual.tipo === 'cancelar') await cancelarSolicitud(id)

      setAviso(MENSAJES_EXITO[actual.tipo])
    } catch (errorAccionado) {
      if (errorAccionado.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setErrorAccion(mensajeError(errorAccionado))
    } finally {
      setAccion(null)
      setProcesando(false)
    }

    // Se vuelve a pedir todo: el estado pudo cambiar con la acción o por otro lado.
    try {
      setDatos(await pedirDatos(id))
    } catch {
      /* se conservan los datos que ya estaban en pantalla */
    }
  }

  const solicitud = datos?.solicitud
  const puedeResponder = solicitud?.estado === 'publicada'
  const modal = datosModal(accion)

  return (
    <LayoutPagina
      titulo="Detalle de la solicitud"
      descripcion="Revisá las propuestas que recibiste y elegí con quién trabajar."
      enlaces={ENLACES_CLIENTE}
    >
      <p>
        <Link
          to={RUTA_SOLICITUDES_CLIENTE}
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Volver a mis solicitudes
        </Link>
      </p>

      {cargando && <Spinner texto="Cargando la solicitud..." />}

      {!cargando && error?.status === 404 && (
        <EstadoVacio
          titulo="No encontramos esa solicitud"
          descripcion="Puede que no exista o que no sea tuya."
        >
          <Link to={RUTA_SOLICITUDES_CLIENTE} className={CLASE_BOTON_ENLACE}>
            Ir a mis solicitudes
          </Link>
        </EstadoVacio>
      )}

      {!cargando && error && error.status !== 404 && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={mensajeError(error)} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && solicitud && (
        <>
          {aviso && (
            <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-800">
              {aviso}
            </p>
          )}
          <MensajeError mensaje={errorAccion} />

          <SolicitudCard solicitud={solicitud} completa />

          {puedeResponder && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAccion({ tipo: 'cancelar' })}
                className="min-h-11 rounded-lg border border-red-300 bg-surface px-5 py-3 font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                Cancelar solicitud
              </button>
            </div>
          )}

          {datos.trabajo && (
            <section className="mt-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Trabajo asignado</h2>
                <Badge estado={datos.trabajo.estado} />
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Técnico</dt>
                  <dd className="font-medium text-ink">
                    {nombreVisible(datos.trabajo.tecnico_nombre, datos.trabajo.tecnico_username)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Precio acordado</dt>
                  <dd className="font-medium text-ink">
                    {formatearDinero(datos.trabajo.precio_acordado)}
                  </dd>
                </div>
              </dl>

              <p className="text-sm text-slate-600">
                El pago se acuerda directamente con el técnico, fuera de MiTécnico.
              </p>

              <Link to={rutaTrabajo(datos.trabajo.id)} className={CLASE_BOTON_ENLACE}>
                Ver seguimiento del trabajo
              </Link>
            </section>
          )}

          <section aria-labelledby="titulo-propuestas" className="space-y-4">
            <h2 id="titulo-propuestas" className="text-xl font-bold text-ink">
              Propuestas recibidas ({datos.propuestas.length})
            </h2>

            {datos.propuestas.length === 0 ? (
              <EstadoVacio
                titulo="Todavía no recibiste propuestas"
                descripcion={
                  puedeResponder
                    ? 'Los técnicos compatibles de tu zona pueden enviarte una propuesta.'
                    : 'Esta solicitud no recibió propuestas.'
                }
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {datos.propuestas.map((propuesta) => (
                  <PropuestaCard
                    key={propuesta.id}
                    propuesta={propuesta}
                    puedeResponder={puedeResponder}
                    onAceptar={(item) => setAccion({ tipo: 'aceptar', propuesta: item })}
                    onRechazar={(item) => setAccion({ tipo: 'rechazar', propuesta: item })}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ModalConfirmacion
        abierto={Boolean(accion)}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
        textoConfirmar={modal.textoConfirmar}
        textoCancelar={modal.textoCancelar}
        peligro={modal.peligro}
        cargando={procesando}
        onConfirmar={confirmarAccion}
        onCancelar={() => setAccion(null)}
      />
    </LayoutPagina>
  )
}

export default DetalleSolicitudPage
