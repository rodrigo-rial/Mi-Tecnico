const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/$/, '')

function extraerMensajeError(datos, estado) {
  if (typeof datos?.detail === 'string') return datos.detail

  if (datos && typeof datos === 'object') {
    const primerError = Object.values(datos).flat().find(Boolean)
    if (primerError) return String(primerError)
  }

  return `La solicitud falló con el código ${estado}.`
}

async function solicitar(ruta, { token, method = 'GET', datos } = {}) {
  if (!token) {
    throw new Error('Se necesita iniciar sesión para acceder al perfil técnico.')
  }

  const esFormulario = datos instanceof FormData
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  if (datos !== undefined && !esFormulario) {
    headers['Content-Type'] = 'application/json'
  }

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    method,
    headers,
    body: datos === undefined
      ? undefined
      : esFormulario
        ? datos
        : JSON.stringify(datos),
  })

  const tipoContenido = respuesta.headers.get('content-type') ?? ''
  const respuestaTieneJson = tipoContenido.includes('application/json')
  const contenido = respuestaTieneJson ? await respuesta.json() : null

  if (!respuesta.ok) {
    const error = new Error(extraerMensajeError(contenido, respuesta.status))
    error.status = respuesta.status
    error.data = contenido
    throw error
  }

  return contenido
}

export function obtenerEspecialidades(token) {
  return solicitar('/tecnicos/especialidades/', { token })
}

export function obtenerZonas(token) {
  return solicitar('/tecnicos/zonas/', { token })
}

export function obtenerPerfilTecnico(token) {
  return solicitar('/tecnicos/perfil/', { token })
}

export function crearPerfilTecnico(token, datos) {
  return solicitar('/tecnicos/perfil/', {
    token,
    method: 'POST',
    datos,
  })
}

export function actualizarPerfilTecnico(token, datos) {
  return solicitar('/tecnicos/perfil/', {
    token,
    method: 'PATCH',
    datos,
  })
}

export function obtenerDocumentacionTecnico(token) {
  return solicitar('/tecnicos/documentacion/', { token })
}

export function actualizarDocumentacionTecnico(token, formulario) {
  return solicitar('/tecnicos/documentacion/', {
    token,
    method: 'PATCH',
    datos: formulario,
  })
}
