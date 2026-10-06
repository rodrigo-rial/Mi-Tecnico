/** 'YYYY-MM-DD' (o ISO) a dd/mm/aaaa, sin corrimientos por zona horaria. */
export function formatearFecha(valor) {
  if (!valor) return '—'
  const [anio, mes, dia] = String(valor).split('T')[0].split('-').map(Number)
  if (!anio || !mes || !dia) return '—'
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Para marcas de tiempo completas como created_at. */
export function formatearFechaHora(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** El backend manda decimales como texto ("1500.00"). */
export function formatearDinero(valor) {
  const numero = Number(valor)
  if (valor === null || valor === undefined || Number.isNaN(numero)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(numero)
}

/** Fecha de hoy en hora local, para el atributo min de un input date. */
export function hoyISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}
