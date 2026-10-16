import { formatearFecha } from "../../utils/reputacion";
import Estrellas from "./Estrellas";

export default function ListaCalificaciones({ calificaciones, usuarioId }) {
  if (calificaciones.length === 0) {
    return <p className="text-sm text-[#364152]">Todavía no hay calificaciones en este trabajo.</p>;
  }
  return (
    <ul className="space-y-3">
      {calificaciones.map((c) => (
        <li key={c.id} className="rounded-lg border border-gray-200 p-3">
          <p className="text-sm font-medium text-[#364152]">
            {c.autor === usuarioId ? "Tu calificación" : `Calificación de ${c.autor_nombre}`}
          </p>
          <Estrellas valor={c.puntaje} />
          {c.comentario && <p className="mt-1 text-sm text-[#364152]">{c.comentario}</p>}
          <p className="mt-1 text-xs text-gray-500">{formatearFecha(c.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}