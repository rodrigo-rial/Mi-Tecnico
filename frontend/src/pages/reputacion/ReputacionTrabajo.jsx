import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// SUPUESTO: módulo de auth de Int. 1 con useAuth() que devuelve { usuario } y usuario.id
import { useAuth } from "../../auth/AuthContext";
import PanelReputacionTrabajo from "../../components/reputacion/PanelReputacionTrabajo";
import { obtenerTrabajo } from "../../services/reputacionService";

export default function ReputacionTrabajoPage() {
  const { trabajoId } = useParams();
  const { usuario } = useAuth();
  const [trabajo, setTrabajo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerTrabajo(trabajoId).then(setTrabajo).catch((e) => setError(e.message));
  }, [trabajoId]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold text-[#364152]">Trabajo #{trabajoId}</h1>
      {error && <p role="alert" className="text-[#ef4444]">{error}</p>}
      {!trabajo && !error && <p>Cargando…</p>}
      {trabajo && <PanelReputacionTrabajo trabajo={trabajo} usuarioId={usuario.id} />}
    </main>
  );
}