import {
  cerrarSesion,
  guardarAccessToken,
  obtenerAccessToken,
  obtenerRefreshToken,
  renovarToken,
} from './authApi'

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

function crearError(contenido, estado) {
  const error = new Error(extraerMensajeError(contenido, estado))
  error.status = estado
  error.data = contenido
  return error
}

function sesionExpirada() {
  const error = new Error('Tu sesión expiró. Volvé a iniciar sesión.')
  error.status = 401
  return error
}

async function enviar(ruta, { method, datos, token }) {
  const headers = { Authorization: `Bearer ${token}` }

  if (datos !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    method,
    headers,
    body: datos === undefined ? undefined : JSON.stringify(datos),
  })

  const tipoContenido = respuesta.headers.get('content-type') ?? ''
  const contenido = tipoContenido.includes('application/json')
    ? await respuesta.json()
    : null

  return { respuesta, contenido }
}

// Si varias llamadas reciben 401 a la vez, se renueva el token una sola vez.
let renovacionEnCurso = null

function renovarAccessToken() {
  if (!renovacionEnCurso) {
    renovacionEnCurso = (async () => {
      const refresh = obtenerRefreshToken()
      if (!refresh) throw sesionExpirada()

      const renovacion = await renovarToken(refresh)
      guardarAccessToken(renovacion.access)
      return renovacion.access
    })().finally(() => {
      renovacionEnCurso = null
    })
  }

  return renovacionEnCurso
}

/**
 * Llamada a la API con el token guardado. Si el access token venció (401),
 * lo renueva con el refresh token y reintenta una vez.
 */
export async function solicitarAutenticado(ruta, { method = 'GET', datos } = {}) {
  let token = obtenerAccessToken()
  if (!token) throw sesionExpirada()

  let resultado = await enviar(ruta, { method, datos, token })

  if (resultado.respuesta.status === 401) {
    try {
      token = await renovarAccessToken()
    } catch {
      cerrarSesion()
      throw sesionExpirada()
    }
    resultado = await enviar(ruta, { method, datos, token })
  }

  if (!resultado.respuesta.ok) {
    throw crearError(resultado.contenido, resultado.respuesta.status)
  }

  return resultado.contenido
}

/** Acepta un array o una respuesta paginada ({ results: [...] }). */
export function extraerLista(datos) {
  if (Array.isArray(datos)) return datos
  if (Array.isArray(datos?.results)) return datos.results
  return []
}
