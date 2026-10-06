export const ENLACES_CLIENTE = [
  { to: '/cliente/solicitudes', texto: 'Mis solicitudes', end: true },
  { to: '/cliente/solicitudes/nueva', texto: 'Nueva solicitud' },
  { to: '/trabajos', texto: 'Mis trabajos' },
  { to: '/cuenta', texto: 'Mi cuenta' },
]

export const ENLACES_TECNICO = [
  { to: '/tecnico/solicitudes', texto: 'Solicitudes' },
  { to: '/tecnico/propuestas', texto: 'Mis propuestas' },
  { to: '/trabajos', texto: 'Mis trabajos' },
  { to: '/tecnico', texto: 'Mi perfil', end: true },
]

/** Menú de navegación según el rol (vacío mientras no se conoce). */
export function enlacesPorRol(rol) {
  if (rol === 'TECNICO') return ENLACES_TECNICO
  if (rol === 'CLIENTE') return ENLACES_CLIENTE
  return []
}

export const RUTA_SOLICITUDES_CLIENTE = '/cliente/solicitudes'
export const RUTA_PERFIL_TECNICO = '/tecnico'
export const RUTA_TRABAJOS = '/trabajos'

export function rutaDetalleSolicitud(id) {
  return `/cliente/solicitudes/${id}`
}

export function rutaTrabajo(id) {
  return `/trabajos/${id}`
}
