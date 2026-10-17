import { extraerLista, solicitarAutenticado } from './http'
// solicitarAutenticado ya renueva la sesión y lanza Error con .status y .message
export function crearCalificacion({ trabajo, puntaje, comentario }) {
  return solicitarAutenticado('/calificaciones/', {
    method: 'POST',
    datos: { trabajo, puntaje, comentario },
  })
}

export const listarCalificacionesDeTrabajo = (trabajoId) =>
  solicitarAutenticado(`/trabajos/${trabajoId}/calificaciones/`).then(extraerLista)

export const obtenerReputacion = (usuarioId) =>
  solicitarAutenticado(`/usuarios/${usuarioId}/reputacion/`)

export const listarFotosDeTrabajo = (trabajoId) =>
  solicitarAutenticado(`/trabajos/${trabajoId}/fotos/`).then(extraerLista)

export const listarFotosDeTecnico = (tecnicoId) =>
  solicitarAutenticado(`/tecnicos/${tecnicoId}/fotos/`).then(extraerLista)

// Usa la misma renovación de sesión que el resto de la API.
export function subirFotoDeTrabajo(trabajoId, archivo, descripcion = '') {
  const formulario = new FormData()
  formulario.append('imagen', archivo)
  formulario.append('descripcion', descripcion)
  return solicitarAutenticado(`/trabajos/${trabajoId}/fotos/`, {
    method: 'POST',
    datos: formulario,
  })
}
