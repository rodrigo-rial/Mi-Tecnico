import { useState } from 'react'
import { Link } from 'react-router-dom'

import { registrarUsuario } from '../services/authApi'

const DATOS_INICIALES = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  confirmarPassword: '',
  rol: 'CLIENTE',
}

function RegistroPage() {
  const [formulario, setFormulario] = useState(DATOS_INICIALES)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  function manejarCambio(evento) {
    const { name, value } = evento.target

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()

    setError('')
    setMensaje('')

    if (formulario.password !== formulario.confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (formulario.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    const datosRegistro = {
      username: formulario.username.trim(),
      email: formulario.email.trim(),
      first_name: formulario.first_name.trim(),
      last_name: formulario.last_name.trim(),
      password: formulario.password,
      rol: formulario.rol,
    }

    try {
      setCargando(true)

      await registrarUsuario(datosRegistro)

      setMensaje('La cuenta fue creada correctamente.')
      setFormulario(DATOS_INICIALES)
      setMostrarPassword(false)
    } catch (errorRegistro) {
      setError(errorRegistro.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">
            Crear una cuenta
          </h1>

          <p className="mt-2 text-slate-600">
            Registrate en MiTécnico como cliente o técnico.
          </p>
        </header>

        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={manejarEnvio}
        >
          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="first_name"
            >
              Nombre
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              value={formulario.first_name}
              onChange={manejarCambio}
              required
              autoComplete="given-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="last_name"
            >
              Apellido
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formulario.last_name}
              onChange={manejarCambio}
              required
              autoComplete="family-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

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
              value={formulario.username}
              onChange={manejarCambio}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="email"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={manejarCambio}
              required
              autoComplete="email"
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
                value={formulario.password}
                onChange={manejarCambio}
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((visible) => !visible)}
                aria-label={
                  mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                title={
                  mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
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

                  {mostrarPassword && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="confirmarPassword"
            >
              Confirmar contraseña
            </label>

            <input
              id="confirmarPassword"
              name="confirmarPassword"
              type="password"
              value={formulario.confirmarPassword}
              onChange={manejarCambio}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1 block font-medium text-slate-700"
              htmlFor="rol"
            >
              Tipo de cuenta
            </label>

            <select
              id="rol"
              name="rol"
              value={formulario.rol}
              onChange={manejarCambio}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="CLIENTE">Cliente</option>
              <option value="TECNICO">Técnico</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-red-700 md:col-span-2">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="rounded-lg bg-green-100 p-3 text-green-700 md:col-span-2">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          ¿Ya tenés una cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  )
}

export default RegistroPage