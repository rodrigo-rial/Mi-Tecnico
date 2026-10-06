const MENSAJE_RED = 'No pudimos conectar con el servidor. Revisá tu conexión.'

/** Texto único para mostrar en un aviso general. */
export function mensajeError(error, respaldo = 'Ocurrió un error inesperado.') {
  if (!error) return respaldo
  if (error instanceof TypeError) return MENSAJE_RED
  return error.message || respaldo
}

function aTexto(valor) {
  if (Array.isArray(valor)) return valor.map(aTexto).join(' ')
  if (valor && typeof valor === 'object') {
    return Object.values(valor).map(aTexto).join(' ')
  }
  return String(valor)
}

/**
 * Convierte el cuerpo de un error 400 del backend en { campo: mensaje }.
 * Los errores sin campo (detail, lista suelta, non_field_errors) quedan en
 * la clave "general".
 */
export function erroresPorCampo(error) {
  const datos = error?.data
  if (!datos) return {}

  if (Array.isArray(datos)) return { general: aTexto(datos) }
  if (typeof datos !== 'object') return { general: String(datos) }

  const resultado = {}
  for (const [campo, valor] of Object.entries(datos)) {
    const clave = campo === 'detail' || campo === 'non_field_errors' ? 'general' : campo
    const texto = aTexto(valor)
    resultado[clave] = resultado[clave] ? `${resultado[clave]} ${texto}` : texto
  }
  return resultado
}
