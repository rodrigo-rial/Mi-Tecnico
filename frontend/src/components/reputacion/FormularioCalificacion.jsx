import { useState } from "react";
import { crearCalificacion } from "../../services/reputacionService";
import SelectorEstrellas from "./SelectorEstrellas";

export default function FormularioCalificacion({ trabajoId, onCalificado }) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    // Validación de comodidad; la validación real está en el backend.
    if (puntaje === 0) {
      setError("Elegí un puntaje de 1 a 5 estrellas.");
      return;
    }
    setEnviando(true);
    try {
      await crearCalificacion({ trabajo: trabajoId, puntaje, comentario });
      onCalificado();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <SelectorEstrellas valor={puntaje} onChange={setPuntaje} deshabilitado={enviando} />

      <div>
        <label htmlFor="comentario" className="block text-sm font-medium text-[#364152]">
          Comentario (opcional)
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={enviando}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-2 focus:outline-[#1447e6]"
        />
        <p className="text-xs text-gray-500">{comentario.length}/500</p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-[#ef4444]">{error}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-[#1a73e8] px-4 py-2 font-medium text-white hover:bg-[#1447e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447e6] disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Enviar calificación"}
      </button>
    </form>
  );
}