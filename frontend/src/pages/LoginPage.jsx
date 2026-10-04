import { useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  guardarTokens,
  iniciarSesion,
  obtenerUsuarioActual,
} from '../services/authApi'

import { obtenerRutaPorRol } from '../utils/rutasPorRol'

const CREDENCIALES_INICIALES = {
  username: '',
  password: '',
}

function LoginPage() {
  const [credenciales, setCredenciales] = useState(
    CREDENCIALES_INICIALES,
  )

  const navigate = useNavigate()

  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [usuario, setUsuario] = useState(null)

  function manejarCambio(evento) {
    const { name, value } = evento.target

    setCredenciales((credencialesActuales) => ({
      ...credencialesActuales,
      [name]: value,
    }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()

    setError('')
    setUsuario(null)

    const datosLogin = {
      username: credenciales.username.trim(),
      password: credenciales.password,
    }

    try {
      setCargando(true)

      const tokens = await iniciarSesion(datosLogin)

      const usuarioActual = await obtenerUsuarioActual(
        tokens.access,
      )
      guardarTokens(tokens)
      setUsuario(usuarioActual)
      setCredenciales(CREDENCIALES_INICIALES)
      setMostrarPassword(false)

      navigate(obtenerRutaPorRol(usuarioActual.rol), {
        replace: true,
      })
    } catch (errorLogin) {
      setError(errorLogin.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-slate-600">
            Ingresá a tu cuenta de MiTécnico.
          </p>
        </header>

        <form
          className="grid gap-5"
          onSubmit={manejarEnvio}
        >
          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="username"
            >
              Nombre de usuario
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={credenciales.username}
              onChange={manejarCambio}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="password"
            >
              Contraseña
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={mostrarPassword ? 'text' : 'password'}
                value={credenciales.password}
                onChange={manejarCambio}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => {
                  setMostrarPassword((visible) => !visible)
                }}
                aria-label={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                title={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 hover:text-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />

                  {mostrarPassword && (
                    <path d="M4 4l16 16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-red-700">
              {error}
            </p>
          )}

          {usuario && (
            <div className="rounded-lg bg-green-100 p-3 text-green-800">
              <p className="font-semibold">
                Inicio de sesión correcto.
              </p>

              <p className="mt-1 text-sm">
                Usuario: {usuario.username}
              </p>

              <p className="text-sm">
                Rol: {usuario.rol}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          ¿Todavía no tenés una cuenta?{' '}
          <Link
            to="/registro"
            className="font-semibold text-blue-700 hover:underline"
          >
            Registrarse
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage