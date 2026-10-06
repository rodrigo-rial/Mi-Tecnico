import { extraerLista } from './http'
import { obtenerAccessToken } from './authApi'
import { conSesionRenovada } from './sesion'
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

/** Especialidades y zonas activas para los selects. */
export function cargarCatalogos() {
  return conSesionRenovada(pedirCatalogos)
}
