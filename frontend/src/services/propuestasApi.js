import { extraerLista, solicitarAutenticado } from './http'

// Solo técnico aprobado. No incluye el título de la solicitud, solo su id.
export function listarMisPropuestas() {
  return solicitarAutenticado('/propuestas/mias/').then(extraerLista)
}

// Responde el TRABAJO creado (con su id), no la propuesta.
export function aceptarPropuesta(id) {
  return solicitarAutenticado(`/propuestas/${id}/aceptar/`, { method: 'POST' })
}

// Responde la propuesta rechazada.
export function rechazarPropuesta(id) {
  return solicitarAutenticado(`/propuestas/${id}/rechazar/`, { method: 'POST' })
}
