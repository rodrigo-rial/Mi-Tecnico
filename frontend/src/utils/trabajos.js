import { nombreVisible } from './formato'

const INICIAR = {
  estado: 'en_proceso',
  texto: 'Iniciar trabajo',
  titulo: 'Iniciar trabajo',
  mensaje: 'Vas a marcar el trabajo como en proceso. Hacelo cuando comiences la visita.',
  textoConfirmar: 'Iniciar',
  peligro: false,
  exito: 'El trabajo está en proceso.',
}

const FINALIZAR = {
  estado: 'finalizado',
  texto: 'Finalizar trabajo',
  titulo: 'Finalizar trabajo',
  mensaje: 'Vas a marcar el trabajo como finalizado. Esta acción no se puede deshacer.',
  textoConfirmar: 'Finalizar',
  peligro: false,
  exito: 'El trabajo fue finalizado.',
}

const CANCELAR = {
  estado: 'cancelado',
  texto: 'Cancelar trabajo',
  titulo: 'Cancelar trabajo',
  mensaje:
    'Si cancelás el trabajo, la solicitud también se cancelará. Esta acción no se puede deshacer.',
  textoConfirmar: 'Sí, cancelar',
  peligro: true,
  exito: 'El trabajo fue cancelado.',
}

/**
 * Acciones que ofrece la pantalla según el estado y el rol. Reflejan las
 * reglas del backend (que igualmente las valida): el técnico inicia y
 * finaliza; cliente y técnico pueden cancelar antes de la finalización.
 */
export function accionesDisponibles(estado, rol) {
  const esParticipante = rol === 'TECNICO' || rol === 'CLIENTE'
  const acciones = []

  if (rol === 'TECNICO' && estado === 'pendiente') acciones.push(INICIAR)
  if (rol === 'TECNICO' && estado === 'en_proceso') acciones.push(FINALIZAR)
  if (esParticipante && (estado === 'pendiente' || estado === 'en_proceso')) {
    acciones.push(CANCELAR)
  }

  return acciones
}

/** Pasos de la línea de tiempo del seguimiento. */
export function armarPasos(trabajo) {
  const { estado } = trabajo
  const tecnico = nombreVisible(trabajo.tecnico_nombre, trabajo.tecnico_username)

  const pasos = [
    {
      titulo: 'Solicitud publicada',
      descripcion: 'El cliente publicó el pedido.',
      estado: 'hecho',
    },
    {
      titulo: 'Técnico asignado',
      descripcion: `${tecnico} fue elegido para realizar el trabajo.`,
      estado: estado === 'pendiente' ? 'actual' : 'hecho',
      fecha: trabajo.created_at,
    },
  ]

  if (estado === 'cancelado') {
    pasos.push({
      titulo: 'Trabajo cancelado',
      descripcion: 'El trabajo se canceló antes de finalizar.',
      estado: 'cancelado',
      fecha: trabajo.updated_at,
    })
    return pasos
  }

  pasos.push({
    titulo: 'En proceso',
    descripcion: 'El técnico está realizando el trabajo.',
    estado: estado === 'pendiente' ? 'pendiente' : estado === 'en_proceso' ? 'actual' : 'hecho',
    fecha: estado === 'en_proceso' ? trabajo.updated_at : undefined,
  })

  pasos.push({
    titulo: 'Finalizado',
    descripcion: 'El servicio quedó terminado.',
    estado: estado === 'finalizado' ? 'hecho' : 'pendiente',
    fecha: estado === 'finalizado' ? trabajo.updated_at : undefined,
  })

  return pasos
}
