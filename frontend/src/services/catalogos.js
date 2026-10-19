import { extraerLista } from './http'
import { obtenerEspecialidades, obtenerZonas } from './tecnicosApi'

function soloActivos(lista) {
  return lista.filter((item) => item.activa !== false)
}

/** Especialidades y zonas activas para los selects. */
export async function cargarCatalogos() {
  const [especialidades, zonas] = await Promise.all([
    obtenerEspecialidades(),
    obtenerZonas(),
  ])

  return {
    especialidades: soloActivos(extraerLista(especialidades)),
    zonas: soloActivos(extraerLista(zonas)),
  }
}