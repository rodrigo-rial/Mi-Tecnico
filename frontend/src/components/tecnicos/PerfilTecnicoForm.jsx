import { useId, useState } from 'react'

const estados = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

function SeleccionCatalogo({ titulo, opciones, seleccion, onChange, disabled }) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="font-semibold text-ink">{titulo}</legend>
      {opciones.length === 0 && (
        <p className="text-sm text-ink">El catálogo todavía no está disponible.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {opciones.map(({ id, nombre }) => (
          <label key={id} className="flex min-h-11 items-center gap-2 rounded-lg border border-line p-3">
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

const sectoresZonas = [
  { titulo: 'La Plata y alrededores', nombres: ['La Plata — casco urbano', 'Tolosa', 'Ringuelet', 'Gonnet', 'City Bell', 'Villa Elisa', 'Los Hornos', 'Berisso', 'Ensenada'] },
  { titulo: 'Zona sur', nombres: ['Berazategui', 'Ranelagh', 'Hudson', 'Quilmes', 'Bernal', 'Don Bosco', 'Ezpeleta', 'Florencio Varela', 'Wilde', 'Avellaneda', 'Lanús', 'Banfield', 'Lomas de Zamora', 'Temperley'] },
  { titulo: 'CABA', nombres: ['La Boca', 'Barracas', 'Constitución', 'San Telmo', 'Monserrat', 'Balvanera', 'Almagro', 'Caballito', 'Flores', 'Palermo'] },
]

function SeleccionZonas({ opciones, seleccion, onChange, disabled }) {
  const grupos = sectoresZonas.map(({ titulo, nombres }) => ({
    titulo,
    opciones: opciones.filter(({ nombre }) => nombres.includes(nombre)),
  }))
  const otras = opciones.filter(({ nombre }) =>
    !sectoresZonas.some(({ nombres }) => nombres.includes(nombre)))
  // Mantener accesibles las zonas anteriores o agregadas desde administración.
  if (otras.length) grupos.push({ titulo: 'Otras zonas', opciones: otras })

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="font-semibold text-ink">Zonas de cobertura</legend>
      <p className="text-sm text-ink">Desplegá cada sector y marcá dónde trabajás. Podés elegir varias zonas.</p>
      {opciones.length === 0 && <p className="text-sm text-ink">El catálogo todavía no está disponible.</p>}
      {grupos.filter((grupo) => grupo.opciones.length > 0).map((grupo) => {
        const cantidad = grupo.opciones.filter(({ id }) => seleccion.includes(id)).length
        return (
          <details key={grupo.titulo} className="rounded-xl border border-line bg-surface">
            <summary className="min-h-11 cursor-pointer rounded-xl p-4 font-semibold text-ink hover:bg-blue-50">
              {grupo.titulo}
              <span className="ml-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-brand">
                {cantidad} seleccionadas
              </span>
            </summary>
            <div className="border-t border-line p-3 sm:p-4">
              <SeleccionCatalogo titulo={`Localidades y barrios de ${grupo.titulo}`}
                opciones={grupo.opciones} seleccion={seleccion}
                onChange={onChange} disabled={disabled} />
            </div>
          </details>
        )
      })}
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
    <form onSubmit={guardar} className="mt-card mx-auto max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-ink">Mi perfil técnico</h2>
        <p className="mt-2 text-ink">Contá qué servicios ofrecés y dónde trabajás.</p>
        <p className="mt-3 text-sm font-medium">
          Estado: {estados[perfil.estado_validacion] ?? 'Todavía sin verificar'}
        </p>
      </header>
      <fieldset disabled={guardando} className="space-y-2">
        <label htmlFor={descripcionId} className="block font-semibold">Descripción profesional</label>
        <textarea id={descripcionId} value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)} rows={4}
          className="mt-input"
          placeholder="Describí tu experiencia y los servicios que realizás." />
        <p className="text-sm text-ink">Opcional. No incluyas datos de tu DNI ni documentos.</p>
      </fieldset>
      <SeleccionCatalogo titulo="Especialidades" opciones={especialidades}
        seleccion={seleccionEspecialidades} onChange={setSeleccionEspecialidades} disabled={guardando} />
      <SeleccionZonas opciones={zonas}
        seleccion={seleccionZonas} onChange={setSeleccionZonas} disabled={guardando} />
      {!conectado && <p className="text-sm text-ink">El guardado todavía no está disponible.</p>}
      {error && <p role="alert" className="border-l-4 border-danger pl-3 text-red-800">{error}</p>}
      <p role="status" className={mensaje ? "border-l-4 border-success pl-3 text-green-800" : ""}>{mensaje}</p>
      <button type="submit" disabled={guardando || !conectado || !catalogosDisponibles}
        className="mt-button">
        {guardando ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}
