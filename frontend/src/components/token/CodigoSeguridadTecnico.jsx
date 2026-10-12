import { useState } from "react";
import { regenerarToken } from "../../services/tokenService";
import { mensajeDeError } from "../../utils/mensajesApi";

function formatearFecha(texto) {
  return new Date(texto).toLocaleString("es-AR");
}

export default function CodigoSeguridadTecnico({ trabajoId, token, onCambio }) {
  const [regenerando, setRegenerando] = useState(false);
  const [error, setError] = useState("");

  async function pedirCodigoNuevo() {
    setError("");
    setRegenerando(true);
    try {
      await regenerarToken(trabajoId);
      onCambio(); // la página vuelve a pedir el estado
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setRegenerando(false);
    }
  }

  if (token.estado === "generado") {
    return (
      <section aria-labelledby="titulo-codigo" className="space-y-3">
        <h2 id="titulo-codigo" className="text-lg font-semibold text-[#364152]">
          Tu código de seguridad
        </h2>
        <p className="text-[#364152]">Mostrale este código al cliente cuando llegues a la visita.</p>

        {/* Los dígitos se ven grandes; el lector de pantalla los lee uno por uno. */}
        <p className="rounded-lg border-2 border-[#1a73e8] bg-white p-4 text-center">
          <span aria-hidden="true" className="text-5xl font-bold tracking-[0.3em] text-[#1447e6]">
            {token.codigo}
          </span>
          <span className="sr-only">Código: {token.codigo.split("").join(" ")}</span>
        </p>

        <p className="text-sm text-[#364152]">Vence el {formatearFecha(token.vence_en)}.</p>
      </section>
    );
  }

  if (token.estado === "validado") {
    return (
      <p role="status" className="rounded-lg border border-[#10b981] bg-green-50 p-3 text-green-900">
        El cliente validó el código el {formatearFecha(token.validado_en)}. La visita quedó confirmada.
      </p>
    );
  }

  if (token.estado === "vencido") {
    return (
      <section className="space-y-3">
        <p className="rounded-lg border border-[#f59e0b] bg-amber-50 p-3 text-amber-900">
          El código venció. Generá uno nuevo para poder validar la visita.
        </p>
        {error && (
          <p role="alert" className="rounded-lg border border-[#ef4444] bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={pedirCodigoNuevo}
          disabled={regenerando}
          className="w-full rounded-lg bg-[#1a73e8] px-4 py-3 font-semibold text-white hover:bg-[#1447e6] focus:outline-none focus:ring-2 focus:ring-[#1447e6] focus:ring-offset-2 disabled:opacity-60"
        >
          {regenerando ? "Generando…" : "Generar código nuevo"}
        </button>
      </section>
    );
  }

  // cancelado
  return (
    <p className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-[#364152]">
      El código fue cancelado porque el trabajo se canceló.
    </p>
  );
}
