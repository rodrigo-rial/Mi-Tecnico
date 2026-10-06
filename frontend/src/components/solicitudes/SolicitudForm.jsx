import { useState } from 'react'
import { Link } from 'react-router-dom'

import Campo from '../comunes/Campo'
import MensajeError from '../comunes/MensajeError'
import { erroresPorCampo, mensajeError } from '../../utils/errores'
import { hoyISO } from '../../utils/formato'

const VALORES_INICIALES = {
  titulo: '',
  descripcion: '',
  especialidad: '',
  zona: '',
  direccion: '',
  fecha_preferida: '',
  es_urgente: false,
}

const CAMPOS = Object.keys(VALORES_INICIALES)

function validar(valores) {
  const errores = {}

  if (!valores.titulo.trim()) errores.titulo = 'Ingresá un título para tu solicitud.'
  if (!valores.descripcion.trim()) {
    errores.descripcion = 'Describí el problema para que el técnico pueda ayudarte.'
  }
  if (!valores.especialidad) errores.especialidad = 'Elegí una especialidad.'
  if (!valores.zona) errores.zona = 'Elegí tu zona.'
  if (!valores.direccion.trim()) errores.direccion = 'Ingresá la dirección del servicio.'
  if (valores.fecha_preferida && valores.fecha_preferida < hoyISO()) {
    errores.fecha_preferida = 'La fecha no puede ser anterior a hoy.'
  }

  return errores
}

function armarDatos(valores) {
  const datos = {
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim(),
    especialidad: Number(valores.especialidad),
    zona: Number(valores.zona),
    direccion: valores.direccion.trim(),
    es_urgente: valores.es_urgente,
  }

  if (valores.fecha_preferida) datos.fecha_preferida = valores.fecha_preferida
  return datos
}

// Los errores del backend que no corresponden a un campo van al aviso general.
function ordenarErrores(error) {
  const recibidos = erroresPorCampo(error)
  if (Object.keys(recibidos).length === 0) return { general: mensajeError(error) }

  const errores = {}
  for (const [campo, texto] of Object.entries(recibidos)) {
    const clave = CAMPOS.includes(campo) ? campo : 'general'
    errores[clave] = errores[clave] ? `${errores[clave]} ${texto}` : texto
  }
  return errores
}

function SolicitudForm({ especialidades, zonas, onGuardar }) {
  const [valores, setValores] = useState(VALORES_INICIALES)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)

  function manejarCambio(evento) {
    const { name, type, value, checked } = evento.target
    setValores((actuales) => ({
      ...actuales,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()

    const erroresLocales = validar(valores)
    setErrores(erroresLocales)
    if (Object.keys(erroresLocales).length > 0) return

    setEnviando(true)
    try {
      await onGuardar(armarDatos(valores))
    } catch (error) {
      setErrores(ordenarErrores(error))
    } finally {
      setEnviando(false)
    }
  }

  function propsCampo(nombre, ayuda) {
    const describedBy = errores[nombre]
      ? `${nombre}-error`
      : ayuda
        ? `${nombre}-ayuda`
        : undefined

    return {
      id: nombre,
      name: nombre,
      value: valores[nombre],
      onChange: manejarCambio,
      'aria-invalid': errores[nombre] ? 'true' : undefined,
      'aria-describedby': describedBy,
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="mt-card space-y-5">
      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <input
          type="text"
          maxLength={150}
          placeholder="Ej.: El tablero salta al encender el aire"
          className="mt-input"
          {...propsCampo('titulo')}
        />
      </Campo>

      <Campo
        id="descripcion"
        etiqueta="Descripción del problema"
        error={errores.descripcion}
        ayuda="Mientras más detalles, mejor propuesta vas a recibir."
      >
        <textarea
          rows={5}
          className="mt-input"
          {...propsCampo('descripcion', true)}
        />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="especialidad" etiqueta="Especialidad" error={errores.especialidad}>
          <select className="mt-input" {...propsCampo('especialidad')}>
            <option value="">Elegí una especialidad</option>
            {especialidades.map((especialidad) => (
              <option key={especialidad.id} value={especialidad.id}>
                {especialidad.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="zona" etiqueta="Zona" error={errores.zona}>
          <select className="mt-input" {...propsCampo('zona')}>
            <option value="">Elegí tu zona</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo id="direccion" etiqueta="Dirección" error={errores.direccion}>
        <input
          type="text"
          maxLength={255}
          placeholder="Calle, número, piso y localidad"
          className="mt-input"
          {...propsCampo('direccion')}
        />
      </Campo>

      <Campo
        id="fecha_preferida"
        etiqueta="Fecha preferida (opcional)"
        error={errores.fecha_preferida}
      >
        <input
          type="date"
          min={hoyISO()}
          className="mt-input"
          {...propsCampo('fecha_preferida')}
        />
      </Campo>

      <div>
        <label className="flex min-h-11 items-center gap-3 font-medium text-ink">
          <input
            type="checkbox"
            name="es_urgente"
            checked={valores.es_urgente}
            onChange={manejarCambio}
          />
          Es urgente
        </label>
        <p className="text-sm text-slate-600">
          Marcala si necesitás atención lo antes posible.
        </p>
        {errores.es_urgente && (
          <p className="mt-1 text-sm font-medium text-red-700">{errores.es_urgente}</p>
        )}
      </div>

      <MensajeError mensaje={errores.general} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          to="/cliente/solicitudes"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 py-3 font-semibold text-ink transition-colors hover:bg-canvas"
        >
          Cancelar
        </Link>
        <button type="submit" disabled={enviando} className="mt-button">
          {enviando ? 'Publicando...' : 'Publicar solicitud'}
        </button>
      </div>
    </form>
  )
}

export default SolicitudForm
