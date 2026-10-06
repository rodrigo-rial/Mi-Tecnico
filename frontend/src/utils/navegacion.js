export const ENLACES_CLIENTE = [
  { to: '/cliente/solicitudes', texto: 'Mis solicitudes', end: true },
  { to: '/cliente/solicitudes/nueva', texto: 'Nueva solicitud' },
  { to: '/cuenta', texto: 'Mi cuenta' },
]

export const RUTA_SOLICITUDES_CLIENTE = '/cliente/solicitudes'

export function rutaDetalleSolicitud(id) {
  return `/cliente/solicitudes/${id}`
}

// La pantalla de seguimiento se crea en la rama del trabajo.
export function rutaTrabajo(id) {
  return `/trabajos/${id}`
}
