import { useEffect, useState } from 'react'
import { solicitarAutenticado } from '../../services/http'

function Foto({ solicitudId, fotoId, numero }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let activa = true
    let temporal
    solicitarAutenticado(`/solicitudes/${solicitudId}/fotos/${fotoId}/`, { archivo: true })
      .then((blob) => {
        if (!activa) return
        temporal = URL.createObjectURL(blob)
        setUrl(temporal)
      })
      .catch(() => {
        if (activa) setError('No se pudo cargar esta foto.')
      })
    return () => {
      activa = false
      if (temporal) URL.revokeObjectURL(temporal)
    }
  }, [solicitudId, fotoId])
  if (error)
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    )
  return url ? (
    <a href={url} target="_blank" rel="noreferrer">
      <img
        src={url}
        alt={`Foto ${numero} del problema`}
        className="h-40 w-full rounded-lg object-contain bg-slate-50"
      />
    </a>
  ) : (
    <p role="status">Cargando foto…</p>
  )
}

export default function FotosSolicitud({ solicitud }) {
  const [abierto, setAbierto] = useState(false)
  if (!solicitud.fotos?.length) return null
  return (
    <div className="mt-4">
      <button
        type="button"
        className="secondary-button"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        {abierto ? 'Ocultar fotos' : `Ver fotos (${solicitud.fotos.length})`}
      </button>
      {abierto && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {solicitud.fotos.map((id, i) => (
            <Foto key={id} solicitudId={solicitud.id} fotoId={id} numero={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
