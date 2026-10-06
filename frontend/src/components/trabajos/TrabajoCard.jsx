import { Link } from 'react-router-dom'

import Badge from '../comunes/Badge'
import { formatearDinero, formatearFechaHora, nombreVisible } from '../../utils/formato'
import { rutaTrabajo } from '../../utils/navegacion'

function TrabajoCard({ trabajo }) {
  return (
    <article className="mt-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          <Link to={rutaTrabajo(trabajo.id)} className="hover:text-brand hover:underline">
            {trabajo.solicitud_titulo}
          </Link>
        </h2>
        <Badge estado={trabajo.estado} />
      </div>

      <p className="mt-1 text-sm text-slate-600">
        {trabajo.especialidad_nombre} · {trabajo.zona_nombre}
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
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
          <dt className="text-slate-500">Precio acordado</dt>
          <dd className="font-medium text-ink">{formatearDinero(trabajo.precio_acordado)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Asignado</dt>
          <dd className="font-medium text-ink">{formatearFechaHora(trabajo.created_at)}</dd>
        </div>
      </dl>

      <p className="mt-4">
        <Link
          to={rutaTrabajo(trabajo.id)}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Ver seguimiento
        </Link>
      </p>
    </article>
  )
}

export default TrabajoCard
