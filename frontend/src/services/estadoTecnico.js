import { obtenerAccessToken } from './authApi'
import { conSesionRenovada } from './sesion'
import { obtenerPerfilTecnico } from './tecnicosApi'

/**
 * Estado de verificación del técnico logueado:
 * 'PENDIENTE' | 'APROBADO' | 'RECHAZADO', o null si todavía no creó su perfil.
 */
export async function obtenerEstadoValidacion() {
  try {
    const perfil = await conSesionRenovada(() =>
      obtenerPerfilTecnico(obtenerAccessToken()),
    )
    return perfil.estado_validacion ?? null
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}
