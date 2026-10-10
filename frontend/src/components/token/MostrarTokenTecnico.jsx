import React, { useState, useEffect } from 'react';
import { tokenApi } from '../../services/tokenApi';

export const MostrarTokenTecnico = ({ trabajoId }) => {
  const [tokenData, setTokenData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const obtenerToken = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await tokenApi.obtenerToken(trabajoId);
      setTokenData(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al obtener el código de validación.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (trabajoId) {
      obtenerToken();
    }
  }, [trabajoId]);

  if (cargando) return <div className="p-4 text-center">Cargando código...</div>;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm max-w-md mx-auto my-4 text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Código de Validación</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      
      {tokenData ? (
        <div>
          <div className="text-3xl font-mono font-bold tracking-widest text-indigo-600 bg-gray-100 p-3 rounded my-2">
            {tokenData.codigo || tokenData.token}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Proporciona este código al cliente al momento de finalizar el trabajo.
          </p>
        </div>
      ) : (
        <button
          onClick={obtenerToken}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition-colors"
        >
          Generar / Ver Código
        </button>
      )}
    </div>
  );
};
