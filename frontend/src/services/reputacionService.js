import { mensajeDeError } from "../utils/reputacion";

// ===== ADAPTADOR (SUPUESTO) =====
// Cambiar SOLO este bloque si el módulo de auth de Int. 1 se llama distinto.
// Si Int. 1 ya tiene un cliente de API (con refresh de token), reemplazá la
// función "pedir" por el suyo.
import { obtenerTokenAcceso } from "../auth/tokenStorage";
const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
// ================================

async function pedir(ruta, { metodo = "GET", cuerpo, esArchivo = false } = {}) {
  const encabezados = { Authorization: `Bearer ${obtenerTokenAcceso()}` };
  // Con archivos NO se pone Content-Type: el navegador arma el multipart solo.
  if (cuerpo && !esArchivo) encabezados["Content-Type"] = "application/json";

  const respuesta = await fetch(`${URL_BASE}/api${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? (esArchivo ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = new Error(mensajeDeError(datos));
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

export const crearCalificacion = ({ trabajo, puntaje, comentario }) =>
  pedir("/calificaciones/", { metodo: "POST", cuerpo: { trabajo, puntaje, comentario } });

export const listarCalificacionesDeTrabajo = (trabajoId) =>
  pedir(`/trabajos/${trabajoId}/calificaciones/`);

export const obtenerReputacion = (usuarioId) =>
  pedir(`/usuarios/${usuarioId}/reputacion/`);

export const listarFotosDeTrabajo = (trabajoId) =>
  pedir(`/trabajos/${trabajoId}/fotos/`);

export const listarFotosDeTecnico = (tecnicoId) =>
  pedir(`/tecnicos/${tecnicoId}/fotos/`);

export function subirFotoDeTrabajo(trabajoId, archivo, descripcion = "") {
  const formulario = new FormData();
  formulario.append("imagen", archivo);
  formulario.append("descripcion", descripcion);
  return pedir(`/trabajos/${trabajoId}/fotos/`, {
    metodo: "POST",
    cuerpo: formulario,
    esArchivo: true,
  });
}

// SUPUESTO: endpoint de detalle de trabajo de Int. 3. Cuando exista su servicio
// (por ejemplo trabajosService.js), usá ese y borrá esta función.
export const obtenerTrabajo = (trabajoId) => pedir(`/trabajos/${trabajoId}/`);