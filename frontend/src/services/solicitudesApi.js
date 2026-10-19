import { extraerLista, solicitarAutenticado } from './http'

// Cliente: sus solicitudes. Técnico: solo las compatibles con su perfil.
export function listarSolicitudes() {
  return solicitarAutenticado('/solicitudes/').then(extraerLista)
}

export function obtenerSolicitud(id) {
  return solicitarAutenticado(`/solicitudes/${id}/`)
}

// datos: { titulo, descripcion, especialidad, zona, direccion,
//          fecha_preferida (YYYY-MM-DD, opcional), es_urgente }
export function crearSolicitud(datos) {
  if (datos.imagenes?.length) {
    const formulario = new FormData()
    for (const [clave, valor] of Object.entries(datos)) {
      if (clave === 'imagenes') valor.forEach((foto) => formulario.append('imagenes', foto))
      else formulario.append(clave, valor)
    }
    datos = formulario
  } else {
    datos = Object.fromEntries(Object.entries(datos).filter(([clave]) => clave !== 'imagenes'))
  }
  return solicitarAutenticado('/solicitudes/', { method: 'POST', datos })
}

// Responde { mensaje }, no la solicitud: hay que volver a pedirla.
export function cancelarSolicitud(id) {
  return solicitarAutenticado(`/solicitudes/${id}/cancelar/`, { method: 'POST' })
}

// Solo el cliente dueño de la solicitud.
export function listarPropuestasDeSolicitud(solicitudId) {
  return solicitarAutenticado(`/solicitudes/${solicitudId}/propuestas/`).then(extraerLista)
}

// Solo técnico aprobado.
// datos: { precio, descripcion_solucion, fecha_disponible (YYYY-MM-DD) }
export function enviarPropuesta(solicitudId, datos) {
  return solicitarAutenticado(`/solicitudes/${solicitudId}/propuestas/`, {
    method: 'POST',
    datos,
  })
}
