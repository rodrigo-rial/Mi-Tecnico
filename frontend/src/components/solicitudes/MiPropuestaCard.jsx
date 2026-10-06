import { Link } from 'react-router-dom'

import Badge from '../comunes/Badge'
import {
  formatearDinero,
  formatearFecha,
  formatearFechaHora,
} from '../../utils/formato'
import { rutaTrabajo } from '../../utils/navegacion'

// Aviso cuando la propuesta sigue pendiente pero la solicitud ya no está abierta.
const AVISOS_SOLICITUD = {
  cancelada: 'El cliente canceló esta solicitud.',
  asignada: 'Esta solicitud ya fue asignada a otro técnico.',
  finalizada: 'Esta solicitud ya fue finalizada.',
}

function MiPropuestaCard({ propuesta, trabajo }) {
  const tieneTitulo = Boolean(propuesta.solicitud_titulo)
  const titulo = propuesta.solicitud_titulo ?? `Solicitud #${propuesta.solicitud}`

  const servicio = [propuesta.especialidad_nombre, propuesta.zona_nombre]
    .filter(Boolean)
    .join(' · ')

  const aviso =
    propuesta.estado === 'pendiente' &&
    propuesta.solicitud_estado &&
    propuesta.solicitud_estado !== 'publicada'
      ? (AVISOS_SOLICITUD[propuesta.solicitud_estado] ?? 'Esta solicitud ya no está disponible.')
      : ''

  return (
    <article className={`mt-card ${propuesta.estado === 'aceptada' ? 'ring-2 ring-emerald-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
          {servicio && <p className="text-sm text-slate-600">{servicio}</p>}
          {tieneTitulo && (
            <p className="text-xs text-slate-500">Solicitud #{propuesta.solicitud}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {propuesta.solicitud_es_urgente && <Badge texto="Urgente" tono="error" />}
          <Badge estado={propuesta.estado} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-brand-dark">
        {formatearDinero(propuesta.precio)}
      </p>
      <p className="text-xs text-slate-500">Precio estimado</p>

      <p className="mt-3 whitespace-pre-line text-ink">{propuesta.descripcion_solucion}</p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {propuesta.solicitud_direccion && (
          <div>
            <dt className="text-slate-500">Dirección</dt>
            <dd className="font-medium text-ink">{propuesta.solicitud_direccion}</dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500">Disponible desde</dt>
          <dd className="font-medium text-ink">{formatearFecha(propuesta.fecha_disponible)}</dd>
        </div>
        {propuesta.created_at && (
          <div>
            <dt className="text-slate-500">Enviada</dt>
            <dd className="font-medium text-ink">{formatearFechaHora(propuesta.created_at)}</dd>
          </div>
        )}
      </dl>

      {aviso && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{aviso}</p>
      )}

      {propuesta.estado === 'aceptada' && trabajo && (
        <p className="mt-4">
          <Link
            to={rutaTrabajo(trabajo.id)}
            className="mt-button inline-flex items-center justify-center"
          >
            Ver trabajo
          </Link>
        </p>
      )}
    </article>
  )
}

export default MiPropuestaCard
