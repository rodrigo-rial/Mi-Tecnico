import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Badge from '../components/comunes/Badge'
import EstadoVacio from '../components/comunes/EstadoVacio'
import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import ModalConfirmacion from '../components/comunes/ModalConfirmacion'
import Spinner from '../components/comunes/Spinner'
import LineaTiempo from '../components/trabajos/LineaTiempo'
import { useUsuarioActual } from '../hooks/useUsuarioActual'
import { cambiarEstadoTrabajo, obtenerTrabajo } from '../services/trabajosApi'
import { mensajeError } from '../utils/errores'
import { formatearDinero, formatearFechaHora, nombreVisible } from '../utils/formato'
import {
  RUTA_TRABAJOS,
  enlacesPorRol,
  rutaDetalleSolicitud,
} from '../utils/navegacion'
import { accionesDisponibles, armarPasos } from '../utils/trabajos'

const CLASE_BOTON_ENLACE = 'mt-button inline-flex items-center justify-center'

function TrabajoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, cargando: cargandoUsuario } = useUsuarioActual()

  const [trabajo, setTrabajo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [accion, setAccion] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  useEffect(() => {
    if (!cargandoUsuario && !usuario) navigate('/login', { replace: true })
  }, [cargandoUsuario, usuario, navigate])

  useEffect(() => {
    let pantallaActiva = true

    obtenerTrabajo(id)
      .then((datos) => {
        if (!pantallaActiva) return
        setTrabajo(datos)
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

  async function confirmar() {
    const actual = accion
    setProcesando(true)
    setErrorAccion('')
    setAviso('')

    try {
      const actualizado = await cambiarEstadoTrabajo(id, actual.estado)
      setTrabajo(actualizado)
      setAviso(actual.exito)
    } catch (errorCambio) {
      if (errorCambio.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setErrorAccion(mensajeError(errorCambio))
      // El estado pudo haber cambiado por otro lado: se vuelve a consultar.
      try {
        setTrabajo(await obtenerTrabajo(id))
      } catch {
        /* se conservan los datos que ya estaban en pantalla */
      }
    } finally {
      setAccion(null)
      setProcesando(false)
    }
  }

  const rol = usuario?.rol
  const acciones = trabajo ? accionesDisponibles(trabajo.estado, rol) : []
  const enCarga = cargando || cargandoUsuario

  return (
    <LayoutPagina
      titulo="Seguimiento del trabajo"
      descripcion="Mirá en qué etapa está el servicio."
      enlaces={enlacesPorRol(rol)}
      conCerrarSesion={rol === 'TECNICO'}
    >
      <p>
        <Link to={RUTA_TRABAJOS} className="text-sm font-semibold text-brand hover:underline">
          ← Volver a mis trabajos
        </Link>
      </p>

      {enCarga && <Spinner texto="Cargando el trabajo..." />}

      {!enCarga && error?.status === 404 && (
        <EstadoVacio
          titulo="No encontramos ese trabajo"
          descripcion="Puede que no exista o que no participes en él."
        >
          <Link to={RUTA_TRABAJOS} className={CLASE_BOTON_ENLACE}>
            Ir a mis trabajos
          </Link>
        </EstadoVacio>
      )}

      {!enCarga && error && error.status !== 404 && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={mensajeError(error)} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!enCarga && !error && trabajo && (
        <>
          {aviso && (
            <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-800">
              {aviso}
            </p>
          )}
          <MensajeError mensaje={errorAccion} />

          <section className="mt-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{trabajo.solicitud_titulo}</h2>
              <Badge estado={trabajo.estado} />
            </div>

            <p className="whitespace-pre-line text-ink">{trabajo.solicitud_descripcion}</p>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Cliente</dt>
                <dd className="font-medium text-ink">
                  {nombreVisible(trabajo.cliente_nombre, trabajo.cliente_username, 'Cliente')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Técnico</dt>
                <dd className="font-medium text-ink">
                  {nombreVisible(trabajo.tecnico_nombre, trabajo.tecnico_username)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Dirección</dt>
                <dd className="font-medium text-ink">{trabajo.direccion}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Servicio</dt>
                <dd className="font-medium text-ink">
                  {trabajo.especialidad_nombre} · {trabajo.zona_nombre}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Precio acordado</dt>
                <dd className="font-medium text-ink">{formatearDinero(trabajo.precio_acordado)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Última actualización</dt>
                <dd className="font-medium text-ink">{formatearFechaHora(trabajo.updated_at)}</dd>
              </div>
            </dl>

            <p className="text-sm text-slate-600">
              El pago se acuerda directamente entre las partes, fuera de MiTécnico.
            </p>

            {rol === 'CLIENTE' && (
              <p>
                <Link
                  to={rutaDetalleSolicitud(trabajo.solicitud)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Ver solicitud y propuestas
                </Link>
              </p>
            )}
          </section>

          <section aria-labelledby="titulo-estado" className="mt-card">
            <h2 id="titulo-estado" className="mb-4 text-lg font-semibold text-ink">
              Estado del trabajo
            </h2>
            <LineaTiempo pasos={armarPasos(trabajo)} />
          </section>

          {acciones.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {acciones.map((item) => (
                <button
                  key={item.estado}
                  type="button"
                  onClick={() => setAccion(item)}
                  className={
                    item.peligro
                      ? 'min-h-11 rounded-lg border border-red-300 bg-surface px-5 py-3 font-semibold text-red-700 transition-colors hover:bg-red-50'
                      : 'mt-button'
                  }
                >
                  {item.texto}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <ModalConfirmacion
        abierto={Boolean(accion)}
        titulo={accion?.titulo}
        mensaje={accion?.mensaje}
        textoConfirmar={accion?.textoConfirmar}
        textoCancelar="Volver"
        peligro={accion?.peligro}
        cargando={procesando}
        onConfirmar={confirmar}
        onCancelar={() => setAccion(null)}
      />
    </LayoutPagina>
  )
}

export default TrabajoDetallePage
