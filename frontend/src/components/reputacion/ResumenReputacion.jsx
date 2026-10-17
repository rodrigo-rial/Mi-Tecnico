import { useEffect, useState } from 'react'
import { obtenerReputacion } from '../../services/reputacionService'
import Estrellas from './Estrellas'

function ResumenUsuario({ usuarioId }) {
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerReputacion(usuarioId).then((datos) => {
      if (activo) setResumen(datos)
    }).catch((fallo) => {
      if (activo) setError(fallo.message)
    })
    return () => { activo = false }
  }, [usuarioId, intento])

  function reintentar() {
    setError('')
    setResumen(null)
    setIntento((valor) => valor + 1)
  }

  if (error) return <div className="space-y-2"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className="text-sm font-semibold text-brand" onClick={reintentar}>Volver a intentar</button></div>
  if (!resumen) return <p role="status" className="text-sm text-slate-500">Cargando calificaciones…</p>
  if (!resumen.cantidad) return <p className="text-sm text-slate-500">Sin calificaciones todavía.</p>

  return <div className="flex flex-wrap items-center gap-2">
    <Estrellas valor={resumen.promedio} />
    <span className="font-bold text-ink">{Number(resumen.promedio).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5</span>
    <span className="text-sm text-slate-500">({resumen.cantidad} {resumen.cantidad === 1 ? 'calificación' : 'calificaciones'})</span>
  </div>
}

export default function ResumenReputacion({ usuarioId }) {
  return usuarioId ? <ResumenUsuario key={usuarioId} usuarioId={usuarioId} /> : null
}
