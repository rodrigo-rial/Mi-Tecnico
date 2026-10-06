import { formatearFechaHora } from '../../utils/formato'

const ESTILOS = {
  hecho: { circulo: 'bg-emerald-500 text-white', icono: '✓', texto: 'Completado' },
  actual: { circulo: 'bg-brand text-white ring-4 ring-blue-100', icono: '●', texto: 'Paso actual' },
  pendiente: { circulo: 'bg-slate-200 text-slate-500', icono: '', texto: 'Pendiente' },
  cancelado: { circulo: 'bg-red-600 text-white', icono: '✕', texto: 'Cancelado' },
}

function LineaTiempo({ pasos }) {
  return (
    <ol>
      {pasos.map((paso, indice) => {
        const estilo = ESTILOS[paso.estado]
        const esUltimo = indice === pasos.length - 1

        return (
          <li
            key={paso.titulo}
            aria-current={paso.estado === 'actual' ? 'step' : undefined}
            className={`relative flex gap-4 ${esUltimo ? '' : 'pb-6'}`}
          >
            {!esUltimo && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 ${
                  paso.estado === 'hecho' ? 'bg-emerald-500' : 'bg-line'
                }`}
              />
            )}

            <span
              aria-hidden="true"
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${estilo.circulo}`}
            >
              {estilo.icono}
            </span>

            <div>
              <p className="font-semibold text-ink">
                {paso.titulo}
                <span className="sr-only"> ({estilo.texto})</span>
              </p>
              <p className="text-sm text-slate-600">{paso.descripcion}</p>
              {paso.fecha && (
                <p className="text-xs font-medium text-brand">
                  {formatearFechaHora(paso.fecha)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default LineaTiempo
