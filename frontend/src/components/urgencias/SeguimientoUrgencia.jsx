import { Link } from 'react-router-dom'
import { formatearDinero } from '../../utils/formato'

const estados = {
  buscando: 'Buscando técnico',
  asignada: 'Técnico asignado',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
}

export default function SeguimientoUrgencia({
  urgencia,
  enviando,
  confirmandoCancelacion,
  onCancelar,
  onVolver,
  onSolicitarCancelacion,
}) {
  return (
    <section className="mt-card space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="font-bold text-lg">
          {urgencia.especialidad_nombre} · {urgencia.zona_nombre}
        </h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900">
          {estados[urgencia.estado]}
        </span>
      </div>
      <p>{urgencia.descripcion}</p>
      <p className="text-sm">
        Visita: {formatearDinero(urgencia.tarifa_visita)} · Adicionales a acordar
      </p>
      <p className="text-sm text-slate-600">{urgencia.direccion}</p>
      {urgencia.estado === 'buscando' && (
        <p role="status">
          Estamos buscando un técnico disponible en tu zona. La búsqueda continúa aunque cierres
          esta pantalla.
        </p>
      )}
      {urgencia.asignaciones.map((a, i) => (
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
            {i === 0 && urgencia.estado === 'asignada' ? 'Ver trabajo y código' : 'Ver detalle'}
          </Link>
        </div>
      ))}
      {['buscando', 'asignada'].includes(urgencia.estado) &&
        (confirmandoCancelacion ? (
          <div className="space-y-2">
            <p>¿Cancelar la urgencia y detener la búsqueda de técnicos?</p>
            <button
              type="button"
              disabled={enviando}
              className="mt-button mr-3"
              onClick={onCancelar}
            >
              Sí, cancelar urgencia
            </button>
            <button type="button" onClick={onVolver}>
              Volver
            </button>
          </div>
        ) : (
          <button type="button" className="text-red-700 underline" onClick={onSolicitarCancelacion}>
            Cancelar urgencia
          </button>
        ))}
    </section>
  )
}
