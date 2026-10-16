// Un id puede venir como número (5) o como objeto ({ id: 5 }) según el serializer de Int. 3.
export function idDe(valor) {
  return valor !== null && typeof valor === "object" ? valor.id : valor;
}

// Saca un mensaje legible de la respuesta de error del backend.
// El backend responde {"detalle": "..."} o {"campo": ["..."]}.
export function mensajeDeError(datos) {
  if (!datos) return "No se pudo completar la operación. Intentá de nuevo.";
  if (typeof datos.detalle === "string") return datos.detalle;
  const primero = Object.values(datos)[0];
  return Array.isArray(primero) ? primero[0] : String(primero);
}

export function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-AR");
}