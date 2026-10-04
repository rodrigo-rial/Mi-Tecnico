const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '')

const ACCESS_TOKEN_KEY = 'mitecnico_access'
const REFRESH_TOKEN_KEY = 'mitecnico_refresh'

function extraerMensajeError(datos, estado) {
  if (
    datos?.detail ===
    'No active account found with the given credentials'
  ) {
    return 'Usuario o contraseña incorrectos.'
  }

  if (typeof datos?.detail === 'string') {
    return datos.detail
  }

  if (datos && typeof datos === 'object') {
    const primerError = Object.values(datos)
      .flat()
      .find(Boolean)

    if (primerError) {
      return String(primerError)
    }
  }

  return `La solicitud falló con el código ${estado}.`
}

async function solicitar(
  ruta,
  {
    method = 'GET',
    token,
    datos,
  } = {},
) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (datos !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    method,
    headers,
    body: datos === undefined
      ? undefined
      : JSON.stringify(datos),
  })

  const tipoContenido =
    respuesta.headers.get('content-type') ?? ''

  const tieneJson = tipoContenido.includes('application/json')

  const contenido = tieneJson
    ? await respuesta.json()
    : null

  if (!respuesta.ok) {
    const error = new Error(
      extraerMensajeError(contenido, respuesta.status),
    )

    error.status = respuesta.status
    error.data = contenido

    throw error
  }

  return contenido
}

export function registrarUsuario(datos) {
  return solicitar('/usuarios/registro/', {
    method: 'POST',
    datos,
  })
}

export function iniciarSesion(credenciales) {
  return solicitar('/token/', {
    method: 'POST',
    datos: credenciales,
  })
}

export function obtenerUsuarioActual(accessToken) {
  return solicitar('/usuarios/actual/', {
    token: accessToken,
  })
}

export function renovarToken(refreshToken) {
  return solicitar('/token/refresh/', {
    method: 'POST',
    datos: {
      refresh: refreshToken,
    },
  })
}

export function guardarTokens(tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function guardarAccessToken(accessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function obtenerAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function obtenerRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function cerrarSesion() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export async function obtenerSesionActual() {
  const accessToken = obtenerAccessToken()
  const refreshToken = obtenerRefreshToken()

  if (!accessToken && !refreshToken) {
    return null
  }

  if (accessToken) {
    try {
      return await obtenerUsuarioActual(accessToken)
    } catch (error) {
      if (error.status !== 401) {
        throw error
      }
    }
  }

  if (!refreshToken) {
    cerrarSesion()
    return null
  }

  try {
    const renovacion = await renovarToken(refreshToken)

    guardarAccessToken(renovacion.access)

    return await obtenerUsuarioActual(renovacion.access)
  } catch {
    cerrarSesion()
    return null
  }
}