import { obtenerAccessToken } from './authApi'
import { extraerLista, solicitarAutenticado } from './http'
import { mensajeDeError } from '../utils/reputacion'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/$/, '')

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

// http.js solo manda JSON, así que la foto (multipart) se envía acá.
// No toca los tokens de sesión: solo lee el access para el encabezado.
export async function subirFotoDeTrabajo(trabajoId, archivo, descripcion = '') {
  const token = obtenerAccessToken()
  if (!token) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.')

  const formulario = new FormData()
  formulario.append('imagen', archivo)
  formulario.append('descripcion', descripcion)

  // Sin Content-Type: el navegador arma el multipart solo.
  const respuesta = await fetch(`${API_BASE_URL}/trabajos/${trabajoId}/fotos/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formulario,
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = new Error(mensajeDeError(datos))
    error.status = respuesta.status
    throw error
  }
  return datos
}