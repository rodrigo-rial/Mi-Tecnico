import Badge from '../comunes/Badge'
import {
  formatearDinero,
  formatearFecha,
  nombreVisible,
} from '../../utils/formato'

const CLASE_BOTON_SECUNDARIO =
  'min-h-11 rounded-lg border border-line bg-surface px-5 py-3 font-semibold text-ink transition-colors hover:bg-canvas'

function PropuestaCard({ propuesta, puedeResponder, onAceptar, onRechazar }) {
  const tecnico = nombreVisible(propuesta.tecnico_nombre, propuesta.tecnico_username)
  const aceptada = propuesta.estado === 'aceptada'

  return (
    <article className={`mt-card ${aceptada ? 'ring-2 ring-emerald-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{tecnico}</h3>
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

      {puedeResponder && propuesta.estado === 'pendiente' && (
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            aria-label={`Rechazar propuesta de ${tecnico}`}
            onClick={() => onRechazar(propuesta)}
            className={CLASE_BOTON_SECUNDARIO}
          >
            Rechazar
          </button>
          <button
            type="button"
            aria-label={`Aceptar propuesta de ${tecnico}`}
            onClick={() => onAceptar(propuesta)}
            className="mt-button"
          >
            Aceptar propuesta
          </button>
        </div>
      )}
    </article>
  )
}

export default PropuestaCard
