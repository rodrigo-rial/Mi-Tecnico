import { solicitarAutenticado } from './http'

// Este "token" es el código de 6 dígitos del trabajo. NO es el JWT de sesión.

export async function obtenerToken(trabajoId) {
  return await solicitarAutenticado(`/trabajos/${trabajoId}/token/`)
}

export async function validarToken(trabajoId, codigo) {
  return await solicitarAutenticado(`/trabajos/${trabajoId}/token/validar/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    datos: { codigo },
  })
}

export async function regenerarToken(trabajoId) {
  return await solicitarAutenticado(`/trabajos/${trabajoId}/token/regenerar/`, {
    method: 'POST',
  })
}
