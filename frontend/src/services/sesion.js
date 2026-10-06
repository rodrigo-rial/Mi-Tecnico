import { obtenerSesionActual } from './authApi'

/**
 * Ejecuta una llamada que usa el token guardado. Si responde 401, renueva la
 * sesión (con el refresh token) y la repite una vez.
 */
export async function conSesionRenovada(pedir) {
  try {
    return await pedir()
  } catch (error) {
    if (error.status !== 401) throw error

    const usuario = await obtenerSesionActual()
    if (!usuario) throw error

    return pedir()
  }
}
