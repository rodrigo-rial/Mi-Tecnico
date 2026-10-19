import { useCallback, useEffect, useState } from 'react'
import {
  listarCalificacionesDeTrabajo,
  listarFotosDeTrabajo,
} from '../../services/reputacionService'
import { idDe } from '../../utils/reputacion'
import FormularioCalificacion from './FormularioCalificacion'
import GaleriaFotos from './GaleriaFotos'
import ListaCalificaciones from './ListaCalificaciones'
import SubirFotosTrabajo from './SubirFotosTrabajo'

// Componente para el detalle del trabajo (lo importa Int. 3).
// Props: trabajo = { id, estado, cliente, tecnico } y usuarioId = id del usuario logueado.
export default function PanelReputacionTrabajo({ trabajo, usuarioId }) {
  const esCliente = usuarioId === idDe(trabajo.cliente)
  const esTecnico = usuarioId === idDe(trabajo.tecnico)
  const finalizado = trabajo.estado === 'finalizado'

  const [calificaciones, setCalificaciones] = useState([])
  const [fotos, setFotos] = useState([])
  const [error, setError] = useState('')

  const cargar = useCallback(
    () =>
      Promise.all([listarCalificacionesDeTrabajo(trabajo.id), listarFotosDeTrabajo(trabajo.id)]),
    [trabajo.id],
  )

  function aplicar([nuevasCalificaciones, nuevasFotos]) {
    setCalificaciones(nuevasCalificaciones)
    setFotos(nuevasFotos)
    setError('')
  }

  function recargar() {
    return cargar()
      .then(aplicar)
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    if (!finalizado || (!esCliente && !esTecnico)) return
    let activo = true
    cargar()
      .then((datos) => {
        if (activo) aplicar(datos)
      })
      .catch((e) => {
        if (activo) setError(e.message)
      })
    return () => {
      activo = false
    }
  }, [finalizado, esCliente, esTecnico, cargar])

  // Solo participantes ven este panel
  if (!esCliente && !esTecnico) return null

  if (!finalizado) {
    return (
      <p className="text-sm text-[#364152]">
        Podrás calificar y subir fotos cuando el trabajo esté finalizado.
      </p>
    )
  }

  const yaCalifique = calificaciones.some((c) => c.autor === usuarioId)

  return (
    <section aria-labelledby="titulo-reputacion" className="space-y-6">
      <h2 id="titulo-reputacion" className="text-xl font-semibold text-[#364152]">
        Calificaciones y fotos
      </h2>

      {error && (
        <p role="alert" className="text-sm font-medium text-[#ef4444]">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-[#364152]">
          {esCliente ? 'Calificá al técnico' : 'Calificá al cliente'}
        </h3>
        {yaCalifique ? (
          <p className="text-sm text-[#10b981]">Ya enviaste tu calificación. ¡Gracias!</p>
        ) : (
          <FormularioCalificacion trabajoId={trabajo.id} onCalificado={recargar} />
        )}
        <ListaCalificaciones calificaciones={calificaciones} usuarioId={usuarioId} />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-[#364152]">Fotos del trabajo</h3>
        <GaleriaFotos fotos={fotos} />
        {esTecnico && (
          <SubirFotosTrabajo
            trabajoId={trabajo.id}
            cantidadActual={fotos.length}
            onSubida={recargar}
          />
        )}
      </div>
    </section>
  )
}
