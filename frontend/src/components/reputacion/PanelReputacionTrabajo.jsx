import { useCallback, useEffect, useState } from "react";
import {
  listarCalificacionesDeTrabajo,
  listarFotosDeTrabajo,
} from "../../services/reputacionService";
import { idDe } from "../../utils/reputacion";
import FormularioCalificacion from "./FormularioCalificacion";
import GaleriaFotos from "./GaleriaFotos";
import ListaCalificaciones from "./ListaCalificaciones";
import SubirFotosTrabajo from "./SubirFotosTrabajo";

// Componente para el detalle del trabajo (lo importa Int. 3).
// Props: trabajo = { id, estado, cliente, tecnico } y usuarioId = id del usuario logueado.
export default function PanelReputacionTrabajo({ trabajo, usuarioId }) {
  const esCliente = usuarioId === idDe(trabajo.cliente);
  const esTecnico = usuarioId === idDe(trabajo.tecnico);
  const finalizado = trabajo.estado === "finalizado";

  const [calificaciones, setCalificaciones] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setCalificaciones(await listarCalificacionesDeTrabajo(trabajo.id));
      setFotos(await listarFotosDeTrabajo(trabajo.id));
    } catch (e) {
      setError(e.message);
    }
  }, [trabajo.id]);

  useEffect(() => {
    if (finalizado && (esCliente || esTecnico)) recargar();
  }, [finalizado, esCliente, esTecnico, recargar]);

  // Solo participantes ven este panel
  if (!esCliente && !esTecnico) return null;

  if (!finalizado) {
    return (
      <p className="text-sm text-[#364152]">
        Podrás calificar y subir fotos cuando el trabajo esté finalizado.
      </p>
    );
  }

  const yaCalifique = calificaciones.some((c) => c.autor === usuarioId);

  return (
    <section aria-labelledby="titulo-reputacion" className="space-y-6">
      <h2 id="titulo-reputacion" className="text-xl font-semibold text-[#364152]">
        Calificaciones y fotos
      </h2>

      {error && <p role="alert" className="text-sm font-medium text-[#ef4444]">{error}</p>}

      <div className="space-y-3">
        <h3 className="font-medium text-[#364152]">
          {esCliente ? "Calificá al técnico" : "Calificá al cliente"}
        </h3>
        {yaCalifique ? (
          <p className="text-sm text-[#10b981]">Ya enviaste tu calificación. ¡Gracias!</p>
        ) : (
          <FormularioCalificacion trabajoId={trabajo.id} onCalificado={recargar} />
        )}
        <ListaCalificaciones calificaciones={calificaciones} usuarioId={usuarioId} />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-[#364152]">Fotos del trabajo</h3>
        <GaleriaFotos fotos={fotos} />
        {esTecnico && (
          <SubirFotosTrabajo
            trabajoId={trabajo.id}
            cantidadActual={fotos.length}
            onSubida={recargar}
          />
        )}
      </div>
    </section>
  );
}