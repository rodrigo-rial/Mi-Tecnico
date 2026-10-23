import { Link } from 'react-router-dom'

import { RUTA_PERFIL_TECNICO } from '../../utils/navegacion'

const TEXTOS = {
  SIN_PERFIL:
    'Todavía no completaste tu perfil profesional. Completalo y enviá tu documentación para poder ver solicitudes y enviar propuestas.',
  PENDIENTE:
    'Tu perfil está pendiente de revisión. Cuando lo aprueben vas a ver las solicitudes compatibles y vas a poder enviar propuestas.',
  RECHAZADO:
    'Tu documentación fue rechazada. Revisala desde tu perfil para poder volver a enviarla.',
}

/**
 * estado: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | null (sin perfil) |
 * undefined (no se pudo consultar: no se muestra nada).
 */
function AvisoVerificacion({ estado }) {
  if (estado === undefined || estado === 'APROBADO') return null

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <p>{TEXTOS[estado ?? 'SIN_PERFIL']}</p>
      <p className="mt-2">
        <Link to={RUTA_PERFIL_TECNICO} className="font-semibold underline">
          Ir a mi perfil
        </Link>
      </p>
    </section>
  )
}

export default AvisoVerificacion
