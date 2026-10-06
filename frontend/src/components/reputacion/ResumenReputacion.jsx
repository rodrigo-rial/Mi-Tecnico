import { useEffect, useState } from "react";
import { obtenerReputacion } from "../../services/reputacionService";
import Estrellas from "./Estrellas";

// Para el perfil: muestra el promedio recibido y la cantidad de calificaciones.
export default function ResumenReputacion({ usuarioId }) {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerReputacion(usuarioId).then(setResumen).catch((e) => setError(e.message));
  }, [usuarioId]);

  if (error) return <p role="alert" className="text-sm text-[#ef4444]">{error}</p>;
  if (!resumen) return <p className="text-sm text-[#364152]">Cargando reputación…</p>;
  if (resumen.cantidad === 0) {
    return <p className="text-sm text-[#364152]">Todavía no tiene calificaciones.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Estrellas valor={resumen.promedio} />
      <span className="font-semibold text-[#364152]">{resumen.promedio.toFixed(1)}</span>
      <span className="text-sm text-[#364152]">
        ({resumen.cantidad} {resumen.cantidad === 1 ? "calificación" : "calificaciones"})
      </span>
    </div>
  );
}