export function obtenerRutaPorRol(rol) {
  switch (rol) {
    case 'TECNICO':
      return '/tecnico'

    case 'CLIENTE':
    case 'ADMINISTRADOR':
      return '/cuenta'

    default:
      return '/login'
  }
}