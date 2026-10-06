import { Link } from 'react-router-dom'

import Badge from '../comunes/Badge'
import { formatearDinero, formatearFecha } from '../../utils/formato'
import { rutaTrabajo } from '../../utils/navegacion'

// trabajo: el trabajo creado a partir de esta propuesta, si fue aceptada.
function MiPropuestaCard({ propuesta, trabajo }) {
  const titulo = propuesta.solicitud_titulo ?? `Solicitud #${propuesta.solicitud}`

  return (
    <article className={`mt-card ${propuesta.estado === 'aceptada' ? 'ring-2 ring-emerald-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
          <p className="text-sm text-slate-600">
            Disponible desde el {formatearFecha(propuesta.fecha_disponible)}
          </p>
        </div>
        <Badge estado={propuesta.estado} />
      </div>

      <p className="mt-4 text-2xl font-bold text-brand-dark">
        {formatearDinero(propuesta.precio)}
      </p>
      <p className="text-xs text-slate-500">Precio estimado</p>

      <p className="mt-3 whitespace-pre-line text-ink">{propuesta.descripcion_solucion}</p>

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
