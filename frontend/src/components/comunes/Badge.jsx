import { CLASES_TONO, infoEstado } from '../../utils/estados'

function Badge({ estado, texto, tono }) {
  const info = infoEstado(estado)

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${CLASES_TONO[tono ?? info.tono]}`}
    >
      {texto ?? info.etiqueta}
    </span>
  )
}

export default Badge
