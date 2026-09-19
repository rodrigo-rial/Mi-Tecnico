import { useId, useState } from 'react'

const estados = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

function SeleccionCatalogo({ titulo, opciones, seleccion, onChange, disabled }) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="font-semibold text-slate-800">{titulo}</legend>
      {opciones.length === 0 && (
        <p className="text-sm text-slate-600">El catálogo todavía no está disponible.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {opciones.map(({ id, nombre }) => (
          <label key={id} className="flex items-center gap-2 rounded border border-slate-300 p-3">
            <input
              type="checkbox"
              checked={seleccion.includes(id)}
              onChange={(event) => onChange(event.target.checked
                ? [...seleccion, id]
                : seleccion.filter((valor) => valor !== id))}
            />
            {nombre}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// Montar después de cargar el perfil y los catálogos. Usar key={perfil.id}
// al cambiar de perfil. onGuardar debe rechazar su promesa si falla la API.
export default function PerfilTecnicoForm({
  perfil = {}, especialidades = [], zonas = [], onGuardar,
}) {
  const descripcionId = useId()
  const [descripcion, setDescripcion] = useState(perfil.descripcion ?? '')
  const [seleccionEspecialidades, setSeleccionEspecialidades] = useState(perfil.especialidades ?? [])
  const [seleccionZonas, setSeleccionZonas] = useState(perfil.zonas ?? [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const conectado = typeof onGuardar === 'function'
  const catalogosDisponibles = especialidades.length > 0 && zonas.length > 0

  async function guardar(event) {
    event.preventDefault()
    if (guardando || !conectado || !catalogosDisponibles) return
    setError('')
    setMensaje('')
    if (!seleccionEspecialidades.length || !seleccionZonas.length) {
      setError('Seleccioná al menos una especialidad y una zona de cobertura.')
      return
    }
    setGuardando(true)
    try {
      await onGuardar({
        descripcion: descripcion.trim(),
        especialidades: seleccionEspecialidades,
        zonas: seleccionZonas,
      })
      setMensaje('Perfil guardado correctamente.')
    } catch {
      setError('No se pudo guardar el perfil. Revisá los datos e intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="mx-auto max-w-2xl space-y-6 rounded-xl bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Mi perfil técnico</h2>
        <p className="mt-2 text-slate-600">Contá qué servicios ofrecés y dónde trabajás.</p>
        <p className="mt-3 text-sm font-medium">
          Estado: {estados[perfil.estado_validacion] ?? 'Todavía sin verificar'}
        </p>
      </header>
      <fieldset disabled={guardando} className="space-y-2">
        <label htmlFor={descripcionId} className="block font-semibold">Descripción profesional</label>
        <textarea id={descripcionId} value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)} rows={4}
          className="w-full rounded border border-slate-300 p-3"
          placeholder="Describí tu experiencia y los servicios que realizás." />
        <p className="text-sm text-slate-600">Opcional. No incluyas datos de tu DNI ni documentos.</p>
      </fieldset>
      <SeleccionCatalogo titulo="Especialidades" opciones={especialidades}
        seleccion={seleccionEspecialidades} onChange={setSeleccionEspecialidades} disabled={guardando} />
      <SeleccionCatalogo titulo="Zonas de cobertura" opciones={zonas}
        seleccion={seleccionZonas} onChange={setSeleccionZonas} disabled={guardando} />
      {!conectado && <p className="text-sm text-slate-600">El guardado todavía no está disponible.</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <p role="status" className="text-green-800">{mensaje}</p>
      <button type="submit" disabled={guardando || !conectado || !catalogosDisponibles}
        className="rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {guardando ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}
