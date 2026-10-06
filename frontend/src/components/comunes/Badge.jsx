import { CLASES_TONO, infoEstado } from '../../utils/estados'

function Badge({ estado, texto }) {
  const { etiqueta, tono } = infoEstado(estado)

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${CLASES_TONO[tono]}`}
    >
      {texto ?? etiqueta}
    </span>
  )
}

export default Badge
