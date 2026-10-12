// F1: si tu cliente axios tiene otro nombre o ruta, cambiá SOLO esta línea.
import api from "./api";

// Este "token" es el código de 6 dígitos del trabajo. NO es el JWT de sesión.

export async function obtenerToken(trabajoId) {
  const { data } = await api.get(`/trabajos/${trabajoId}/token/`);
  return data;
}

export async function validarToken(trabajoId, codigo) {
  const { data } = await api.post(`/trabajos/${trabajoId}/token/validar/`, { codigo });
  return data;
}

export async function regenerarToken(trabajoId) {
  const { data } = await api.post(`/trabajos/${trabajoId}/token/regenerar/`);
  return data;
}