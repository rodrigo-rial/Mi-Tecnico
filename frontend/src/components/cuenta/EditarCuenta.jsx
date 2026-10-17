import { useState } from 'react'
import { solicitarAutenticado } from '../../services/http'

const campos = [
  ['first_name', 'Nombre', 'text', 150],
  ['last_name', 'Apellido', 'text', 150],
  ['email', 'Correo electrónico', 'email', 254],
  ['telefono', 'Teléfono', 'tel', 30],
  ['domicilio_referencia', 'Domicilio de referencia', 'text', 255],
]

export default function EditarCuenta({ usuario, onGuardado, onCancelar }) {
  const [datos, setDatos] = useState(() => Object.fromEntries(campos.map(([campo]) => [campo, usuario[campo] ?? ''])))
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')

  async function guardar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setError('')
    try {
      const cuenta = await solicitarAutenticado('/usuarios/actual/', { method: 'PATCH', datos })
      onGuardado(cuenta)
    } catch (fallo) {
      setErrores(fallo.data ?? {})
      setError(fallo.message)
    } finally {
      setEnviando(false)
    }
  }

  return <form onSubmit={guardar} className="mt-5 space-y-4">
    {campos.map(([campo, etiqueta, tipo, maximo]) => <div key={campo}>
      <label className="block text-sm font-semibold mb-2" htmlFor={`cuenta-${campo}`}>{etiqueta}</label>
      <input id={`cuenta-${campo}`} type={tipo} maxLength={maximo} required={campo === 'email'} disabled={enviando}
        value={datos[campo]} onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
        aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `error-${campo}` : undefined}
        className="w-full rounded-lg border border-slate-300 bg-white p-3 focus-visible:outline-2 focus-visible:outline-brand" />
      {errores[campo] && <p id={`error-${campo}`} className="text-sm text-red-700 mt-1">{[].concat(errores[campo]).join(' ')}</p>}
    </div>)}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button className="mt-button" disabled={enviando} type="submit">{enviando ? 'Guardando…' : 'Guardar cambios'}</button><button className="secondary-button" disabled={enviando} type="button" onClick={onCancelar}>Cancelar</button></div>
  </form>
}
