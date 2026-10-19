import { useEffect, useState } from 'react'
import { solicitarAutenticado } from '../../services/http'

function Imagen({ ruta, nombre }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let activo = true
    let temporal
    solicitarAutenticado(ruta, { archivo: true })
      .then((blob) => {
        if (!activo) return
        temporal = URL.createObjectURL(blob)
        setUrl(temporal)
      })
      .catch(() => {
        /* Se conserva el icono si la imagen no está disponible. */
      })
    return () => {
      activo = false
      if (temporal) URL.revokeObjectURL(temporal)
    }
  }, [ruta])
  return url ? (
    <img
      src={url}
      alt={`Foto de ${nombre}`}
      className="h-full w-full object-cover"
      onError={() => setUrl('')}
    />
  ) : (
    <SinFoto />
  )
}

function SinFoto() {
  return (
    <svg
      role="img"
      aria-label="Sin foto de perfil"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-3/5 w-3/5"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </svg>
  )
}

export default function Avatar({ ruta, nombre = 'usuario', className = 'h-16 w-16' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700 ${className}`}
    >
      {ruta ? <Imagen key={ruta} ruta={ruta} nombre={nombre} /> : <SinFoto />}
    </div>
  )
}
