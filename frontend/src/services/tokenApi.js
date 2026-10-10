import http from './http';

export const tokenApi = {
  // Obtener o generar el token de un trabajo (para el técnico)
  obtenerToken: async (trabajoId) => {
    const response = await http.get(`/trabajos/${trabajoId}/token/`);
    return response.data;
  },

  // Validar el token ingresado (para el cliente)
  validarToken: async (trabajoId, codigo) => {
    const response = await http.post(`/trabajos/${trabajoId}/token/validar/`, { codigo });
    return response.data;
  },
};
