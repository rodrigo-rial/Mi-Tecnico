import { useEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
} from 'react-router-dom'

import { obtenerSesionActual } from '../services/authApi'
import { obtenerRutaPorRol } from '../utils/rutasPorRol'

function RutaProtegida({ rolesPermitidos }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let componenteActivo = true

    async function comprobarSesion() {
      try {
        const usuarioActual = await obtenerSesionActual()

        if (componenteActivo) {
          setUsuario(usuarioActual)
        }
      } catch (errorSesion) {
        if (componenteActivo) {
          setError(errorSesion.message)
        }
      } finally {
        if (componenteActivo) {
          setCargando(false)
        }
      }
    }

    comprobarSesion()

    return () => {
      componenteActivo = false
    }
  }, [])

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Comprobando sesión...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </p>
      </main>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    return (
      <Navigate
        to={obtenerRutaPorRol(usuario.rol)}
        replace
      />
    )
  }

  return <Outlet />
}

export default RutaProtegida