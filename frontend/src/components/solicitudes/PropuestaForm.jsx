import { useId, useState } from 'react'

import Campo from '../comunes/Campo'
import MensajeError from '../comunes/MensajeError'
import { erroresPorCampo, mensajeError } from '../../utils/errores'
import { hoyISO } from '../../utils/formato'

const VALORES_INICIALES = {
  precio: '',
  descripcion_solucion: '',
  fecha_disponible: '',
}

const CAMPOS = Object.keys(VALORES_INICIALES)
const FORMATO_PRECIO = /^\d+([.,]\d{1,2})?$/

function validar(valores) {
  const errores = {}
  const precio = valores.precio.trim()

  if (!precio) {
    errores.precio = 'Ingresá el precio estimado.'
  } else if (!FORMATO_PRECIO.test(precio) || Number(precio.replace(',', '.')) <= 0) {
    errores.precio = 'Ingresá un precio válido mayor a cero, con hasta 2 decimales.'
  }

  if (!valores.descripcion_solucion.trim()) {
    errores.descripcion_solucion = 'Contale al cliente cómo vas a resolver el problema.'
  }

  if (!valores.fecha_disponible) {
    errores.fecha_disponible = 'Indicá desde qué fecha podés realizar el trabajo.'
  } else if (valores.fecha_disponible < hoyISO()) {
    errores.fecha_disponible = 'La fecha no puede ser anterior a hoy.'
  }

  return errores
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

function PropuestaForm({ onEnviar, onCancelar }) {
  const base = useId()
  const [valores, setValores] = useState(VALORES_INICIALES)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)

  const id = (campo) => `${base}-${campo}`

  function manejarCambio(evento) {
    const { name, value } = evento.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()

    const erroresLocales = validar(valores)
    setErrores(erroresLocales)
    if (Object.keys(erroresLocales).length > 0) return

    setEnviando(true)
    try {
      await onEnviar({
        precio: valores.precio.trim().replace(',', '.'),
        descripcion_solucion: valores.descripcion_solucion.trim(),
        fecha_disponible: valores.fecha_disponible,
      })
    } catch (error) {
      setErrores(ordenarErrores(error))
    } finally {
      setEnviando(false)
    }
  }

  function propsCampo(nombre) {
    return {
      id: id(nombre),
      name: nombre,
      value: valores[nombre],
      onChange: manejarCambio,
      'aria-invalid': errores[nombre] ? 'true' : undefined,
      'aria-describedby': errores[nombre] ? `${id(nombre)}-error` : undefined,
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="space-y-4 rounded-xl border border-line bg-canvas p-4"
    >
      <Campo id={id('precio')} etiqueta="Precio estimado (ARS)" error={errores.precio}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Ej.: 15000"
          className="mt-input"
          {...propsCampo('precio')}
        />
      </Campo>

      <Campo
        id={id('descripcion_solucion')}
        etiqueta="Descripción de la solución"
        error={errores.descripcion_solucion}
      >
        <textarea rows={4} className="mt-input" {...propsCampo('descripcion_solucion')} />
      </Campo>

      <Campo
        id={id('fecha_disponible')}
        etiqueta="Fecha disponible"
        error={errores.fecha_disponible}
      >
        <input
          type="date"
          min={hoyISO()}
          className="mt-input"
          {...propsCampo('fecha_disponible')}
        />
      </Campo>

      <MensajeError mensaje={errores.general} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="min-h-11 rounded-lg border border-line bg-surface px-5 py-3 font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="mt-button">
          {enviando ? 'Enviando...' : 'Enviar propuesta'}
        </button>
      </div>
    </form>
  )
}

export default PropuestaForm
