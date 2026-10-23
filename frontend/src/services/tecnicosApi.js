import { solicitarAutenticado } from './http'

export function obtenerEspecialidades() {
  return solicitarAutenticado('/tecnicos/especialidades/')
}

export function obtenerZonas() {
  return solicitarAutenticado('/tecnicos/zonas/')
}

export function obtenerPerfilTecnico() {
  return solicitarAutenticado('/tecnicos/perfil/')
}

export function crearPerfilTecnico(datos) {
  return solicitarAutenticado('/tecnicos/perfil/', {
    method: 'POST',
    datos,
  })
}

export function actualizarPerfilTecnico(datos) {
  return solicitarAutenticado('/tecnicos/perfil/', {
    method: 'PATCH',
    datos,
  })
}

export function obtenerDocumentacionTecnico() {
  return solicitarAutenticado('/tecnicos/documentacion/')
}

export function actualizarDocumentacionTecnico(formulario) {
  return solicitarAutenticado('/tecnicos/documentacion/', {
    method: 'PATCH',
    datos: formulario,
  })
}
