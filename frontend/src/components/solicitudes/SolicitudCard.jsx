import { Link } from 'react-router-dom'

import Badge from '../comunes/Badge'
import { formatearFecha, formatearFechaHora } from '../../utils/formato'
import { rutaDetalleSolicitud } from '../../utils/navegacion'

/**
 * completa: muestra la descripción entera (detalle).
 * conEnlace: el título y "Ver detalle" llevan al detalle del cliente; por
 *   defecto solo en el modo resumen. El técnico lo desactiva.
 * children: acciones u otro contenido al pie de la tarjeta.
 */
function SolicitudCard({
  solicitud,
  completa = false,
  conEnlace = !completa,
  children,
}) {
  return (
    <article className="mt-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          {conEnlace ? (
            <Link
              to={rutaDetalleSolicitud(solicitud.id)}
              className="hover:text-brand hover:underline"
            >
              {solicitud.titulo}
            </Link>
          ) : (
            solicitud.titulo
          )}
        </h2>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {solicitud.es_urgente && <Badge texto="Urgente" tono="error" />}
          <Badge estado={solicitud.estado} />
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-600">
        {solicitud.especialidad_nombre} · {solicitud.zona_nombre}
      </p>

      <p className={`mt-3 whitespace-pre-line text-ink ${completa ? '' : 'line-clamp-2'}`}>
        {solicitud.descripcion}
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Dirección</dt>
          <dd className="font-medium text-ink">{solicitud.direccion}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fecha preferida</dt>
          <dd className="font-medium text-ink">
            {formatearFecha(solicitud.fecha_preferida)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Publicada</dt>
          <dd className="font-medium text-ink">
            {formatearFechaHora(solicitud.created_at)}
          </dd>
        </div>
      </dl>

      {conEnlace && !completa && (
        <p className="mt-4">
          <Link
            to={rutaDetalleSolicitud(solicitud.id)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Ver detalle y propuestas
          </Link>
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </article>
  )
}

export default SolicitudCard
