// Estados de solicitud, propuesta y trabajo con su etiqueta y tono.
const ESTADOS = {
  // Solicitud
  publicada: { etiqueta: 'Publicada', tono: 'advertencia' },
  asignada: { etiqueta: 'Asignada', tono: 'primario' },
  finalizada: { etiqueta: 'Finalizada', tono: 'exito' },
  cancelada: { etiqueta: 'Cancelada', tono: 'error' },
  // Propuesta (y trabajo, que comparte "pendiente")
  pendiente: { etiqueta: 'Pendiente', tono: 'advertencia' },
  aceptada: { etiqueta: 'Aceptada', tono: 'exito' },
  rechazada: { etiqueta: 'Rechazada', tono: 'error' },
  // Trabajo
  en_proceso: { etiqueta: 'En proceso', tono: 'primario' },
  finalizado: { etiqueta: 'Finalizado', tono: 'exito' },
  cancelado: { etiqueta: 'Cancelado', tono: 'error' },
}

// Texto en tonos oscuros para mantener el contraste sobre fondo claro.
export const CLASES_TONO = {
  exito: 'bg-emerald-100 text-emerald-800',
  advertencia: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  primario: 'bg-blue-100 text-blue-800',
  neutro: 'bg-slate-100 text-slate-700',
}

export function infoEstado(estado) {
  return ESTADOS[estado] ?? { etiqueta: estado ?? '—', tono: 'neutro' }
}
