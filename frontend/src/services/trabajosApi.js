import { extraerLista, solicitarAutenticado } from './http'

// Solo los trabajos en los que participa el usuario. estado es opcional.
export function listarTrabajos({ estado } = {}) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  return solicitarAutenticado(`/trabajos/${consulta}`).then(extraerLista)
}

export function obtenerTrabajo(id) {
  return solicitarAutenticado(`/trabajos/${id}/`)
}

// estado: 'en_proceso' | 'finalizado' | 'cancelado'. Responde el trabajo.
export function cambiarEstadoTrabajo(id, estado) {
  return solicitarAutenticado(`/trabajos/${id}/estado/`, {
    method: 'POST',
    datos: { estado },
  })
}
