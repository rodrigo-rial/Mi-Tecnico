export function obtenerRutaPorRol(rol) {
  switch (rol) {
    case 'TECNICO':
      return '/tecnico'

    case 'CLIENTE':
      return '/cliente/solicitudes'

    case 'ADMINISTRADOR':
      return '/cuenta'

    default:
      return '/login'
  }
}
