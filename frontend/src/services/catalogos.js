import { extraerLista } from './http'
import { obtenerAccessToken, obtenerSesionActual } from './authApi'
import { obtenerEspecialidades, obtenerZonas } from './tecnicosApi'

function soloActivos(lista) {
  return lista.filter((item) => item.activa !== false)
}

async function pedirCatalogos() {
  const token = obtenerAccessToken()
  const [especialidades, zonas] = await Promise.all([
    obtenerEspecialidades(token),
    obtenerZonas(token),
  ])

  return {
    especialidades: soloActivos(extraerLista(especialidades)),
    zonas: soloActivos(extraerLista(zonas)),
  }
}

/**
 * Especialidades y zonas para los selects. Los servicios de tecnicosApi no
 * renuevan el token, así que ante un 401 se renueva la sesión y se reintenta.
 */
export async function cargarCatalogos() {
  try {
    return await pedirCatalogos()
  } catch (error) {
    if (error.status !== 401) throw error

    const usuario = await obtenerSesionActual()
    if (!usuario) throw error

    return pedirCatalogos()
  }
}
