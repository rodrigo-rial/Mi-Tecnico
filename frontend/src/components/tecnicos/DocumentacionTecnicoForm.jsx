import { useId, useState } from 'react'

const LIMITE_ARCHIVO_BYTES = 5 * 1024 * 1024
const EXTENSIONES_PERMITIDAS = ['pdf', 'jpg', 'jpeg', 'png']

const etiquetasEstado = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

function validarArchivo(archivo) {
  if (!archivo) return ''
  const extension = archivo.name.split('.').pop()?.toLowerCase()
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    return 'El archivo debe ser PDF, JPG, JPEG o PNG.'
  }
  if (archivo.size > LIMITE_ARCHIVO_BYTES) {
    return 'El archivo no puede superar los 5 MB.'
  }
  return ''
}

export default function DocumentacionTecnicoForm({
  documentacion = {},
  onGuardar,
}) {
  const dniId = useId()
  const matriculaId = useId()
  const documentoDniId = useId()
  const documentoMatriculaId = useId()
  const [dniNumero, setDniNumero] = useState(documentacion.dni_numero ?? '')
  const [matriculaNumero, setMatriculaNumero] = useState(
    documentacion.matricula_numero ?? '',
  )
  const [documentoDni, setDocumentoDni] = useState(null)
  const [documentoMatricula, setDocumentoMatricula] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const conectado = typeof onGuardar === 'function'

  async function guardar(event) {
    event.preventDefault()
    if (!conectado || guardando) return

    setError('')
    setMensaje('')
    const errorDni = validarArchivo(documentoDni)
    const errorMatricula = validarArchivo(documentoMatricula)
    if (errorDni || errorMatricula) {
      setError(errorDni || errorMatricula)
      return
    }
    if (!dniNumero.trim() || !matriculaNumero.trim()) {
      setError('Completá el número de DNI y la matrícula.')
      return
    }

    const datos = new FormData()
    datos.append('dni_numero', dniNumero.trim())
    datos.append('matricula_numero', matriculaNumero.trim())
    if (documentoDni) datos.append('documento_dni', documentoDni)
    if (documentoMatricula) {
      datos.append('documento_matricula', documentoMatricula)
    }

    setGuardando(true)
    try {
      await onGuardar(datos)
      setMensaje('Documentación guardada. El perfil quedó pendiente de revisión.')
      setDocumentoDni(null)
      setDocumentoMatricula(null)
    } catch {
      setError('No se pudo guardar la documentación. Revisá los archivos.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="mt-card mx-auto max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-ink">Documentación profesional</h2>
        <p className="mt-2 text-ink">
          Cargá documentos de prueba durante el desarrollo. No uses datos reales.
        </p>
        <p className="mt-3 font-medium text-ink">
          Estado: {etiquetasEstado[documentacion.estado_validacion] ?? 'Sin enviar'}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor={dniId} className="space-y-2 font-semibold text-ink">
          Número de DNI
          <input id={dniId} value={dniNumero} onChange={(event) => setDniNumero(event.target.value)}
            disabled={guardando} className="mt-input" />
        </label>
        <label htmlFor={matriculaId} className="space-y-2 font-semibold text-ink">
          Número de matrícula
          <input id={matriculaId} value={matriculaNumero}
            onChange={(event) => setMatriculaNumero(event.target.value)} disabled={guardando}
            className="mt-input" />
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor={documentoDniId} className="block font-semibold text-ink">
          Archivo de DNI
        </label>
        <input id={documentoDniId} type="file" className="mt-file" accept=".pdf,.jpg,.jpeg,.png"
          disabled={guardando} onChange={(event) => setDocumentoDni(event.target.files[0] ?? null)} />
        <p className="text-sm text-ink">
          {documentacion.tiene_documento_dni ? 'Ya existe un archivo cargado. Elegir otro lo reemplazará.' : 'Todavía no hay un archivo cargado.'}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={documentoMatriculaId} className="block font-semibold text-ink">
          Archivo de matrícula
        </label>
        <input id={documentoMatriculaId} type="file" className="mt-file" accept=".pdf,.jpg,.jpeg,.png"
          disabled={guardando}
          onChange={(event) => setDocumentoMatricula(event.target.files[0] ?? null)} />
        <p className="text-sm text-ink">
          {documentacion.tiene_documento_matricula ? 'Ya existe un archivo cargado. Elegir otro lo reemplazará.' : 'Todavía no hay un archivo cargado.'}
        </p>
      </div>

      <p className="text-sm text-ink">Formatos permitidos: PDF, JPG, JPEG y PNG. Máximo 5 MB por archivo.</p>
      {!conectado && <p className="text-sm text-ink">El guardado todavía no está conectado.</p>}
      {error && <p role="alert" className="border-l-4 border-danger pl-3 text-red-800">{error}</p>}
      <p role="status" className={mensaje ? "border-l-4 border-success pl-3 text-green-800" : ""}>{mensaje}</p>
      <button type="submit" disabled={!conectado || guardando}
        className="mt-button">
        {guardando ? 'Guardando…' : 'Guardar documentación'}
      </button>
    </form>
  )
}
