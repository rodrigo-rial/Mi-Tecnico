import { useState } from "react";
import { subirFotoDeTrabajo } from "../../services/reputacionService";

// Estos límites son solo para avisar rápido; el backend es quien manda.
const MAX_MB = 5;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

export default function SubirFotosTrabajo({ trabajoId, cantidadActual, maximo = 5, onSubida }) {
  const [archivo, setArchivo] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  if (cantidadActual >= maximo) {
    return <p className="text-sm text-[#364152]">Alcanzaste el máximo de {maximo} fotos.</p>;
  }

  function elegirArchivo(evento) {
    setError("");
    setExito("");
    const elegido = evento.target.files[0];
    if (!elegido) return setArchivo(null);
    if (!TIPOS.includes(elegido.type)) {
      setArchivo(null);
      return setError("Elegí una imagen JPG, PNG o WEBP.");
    }
    if (elegido.size > MAX_MB * 1024 * 1024) {
      setArchivo(null);
      return setError(`La foto no puede pesar más de ${MAX_MB} MB.`);
    }
    setArchivo(elegido);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!archivo) return setError("Elegí una foto primero.");
    setEnviando(true);
    setError("");
    try {
      await subirFotoDeTrabajo(trabajoId, archivo, descripcion);
      setExito("Foto subida correctamente.");
      setArchivo(null);
      setDescripcion("");
      evento.target.reset();
      onSubida();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div>
        <label htmlFor="foto" className="block text-sm font-medium text-[#364152]">
          Agregar foto ({cantidadActual}/{maximo})
        </label>
        <input
          id="foto"
          type="file"
          accept={TIPOS.join(",")}
          onChange={elegirArchivo}
          disabled={enviando}
          className="mt-1 block w-full text-sm"
        />
      </div>
      <div>
        <label htmlFor="descripcion-foto" className="block text-sm font-medium text-[#364152]">
          Descripción (opcional)
        </label>
        <input
          id="descripcion-foto"
          type="text"
          maxLength={200}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={enviando}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-2 focus:outline-[#1447e6]"
        />
      </div>

      {error && <p role="alert" className="text-sm font-medium text-[#ef4444]">{error}</p>}
      {exito && <p role="status" className="text-sm font-medium text-[#10b981]">{exito}</p>}

      <button
        type="submit"
        disabled={enviando || !archivo}
        className="rounded-lg bg-[#1a73e8] px-4 py-2 font-medium text-white hover:bg-[#1447e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447e6] disabled:opacity-60"
      >
        {enviando ? "Subiendo…" : "Subir foto"}
      </button>
    </form>
  );
}