import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  cerrarSesion,
  obtenerSesionActual,
} from '../services/authApi'

function CuentaPage() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let componenteActivo = true

    async function cargarSesion() {
      try {
        const usuarioActual = await obtenerSesionActual()

        if (!componenteActivo) {
          return
        }

        if (!usuarioActual) {
          navigate('/login', { replace: true })
          return
        }

        setUsuario(usuarioActual)
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

    cargarSesion()

    return () => {
      componenteActivo = false
    }
  }, [navigate])

  function manejarCierreSesion() {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

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
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={manejarCierreSesion}
            className="mt-5 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Volver al inicio de sesión
          </button>
        </section>
      </main>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <header className="mb-6">
          <p className="font-semibold text-blue-700">
            MiTécnico
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Mi cuenta
          </h1>
        </header>

        <div className="grid gap-4">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Nombre completo
            </p>

            <p className="font-semibold text-slate-800">
              {usuario.first_name} {usuario.last_name}
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Nombre de usuario
            </p>

            <p className="font-semibold text-slate-800">
              {usuario.username}
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Correo electrónico
            </p>

            <p className="font-semibold text-slate-800">
              {usuario.email}
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Rol
            </p>

            <p className="font-semibold text-slate-800">
              {usuario.rol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={manejarCierreSesion}
          className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}

export default CuentaPage