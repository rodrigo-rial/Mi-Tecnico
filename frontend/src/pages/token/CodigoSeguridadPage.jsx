import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerToken } from "../../services/tokenService";
import { mensajeError } from "../../utils/errores";
import CodigoSeguridadTecnico from "../../components/token/CodigoSeguridadTecnico";
import FormularioValidarCodigo from "../../components/token/FormularioValidarCodigo";

export default function CodigoSeguridadPage() {
  const { trabajoId } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setError("");
      setDatos(await obtenerToken(trabajoId));
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [trabajoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function alValidar(respuesta) {
    setExito(true);
    setDatos((anterior) => ({
      ...anterior,
      trabajo_estado: respuesta.trabajo_estado,
      token: respuesta.token,
    }));
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#364152]">Código de seguridad · Trabajo #{trabajoId}</h1>

      {error && (
        <p role="alert" className="rounded-lg border border-[#ef4444] bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {!datos && !error && <p>Cargando…</p>}

      {datos && datos.rol === "tecnico" && (
        <>
          <CodigoSeguridadTecnico trabajoId={trabajoId} token={datos.token} onCambio={cargar} />
          <button
            type="button"
            onClick={cargar}
            className="w-full rounded-lg border border-[#1a73e8] px-4 py-3 font-semibold text-[#1a73e8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1447e6] focus:ring-offset-2"
          >
            Actualizar estado
          </button>
        </>
      )}

      {datos && datos.rol === "cliente" && (
        <section aria-labelledby="titulo-cliente" className="space-y-3">
          <h2 id="titulo-cliente" className="text-lg font-semibold text-[#364152]">
            Confirmá la visita del técnico
          </h2>

          {datos.token.estado === "generado" && (
            <FormularioValidarCodigo trabajoId={trabajoId} onValidado={alValidar} />
          )}

          {datos.token.estado === "validado" && (
            <p role="status" className="rounded-lg border border-[#10b981] bg-green-50 p-3 text-green-900">
              {exito ? "¡Código correcto! " : ""}La visita quedó confirmada
              {datos.token.validado_en && ` el ${new Date(datos.token.validado_en).toLocaleString("es-AR")}`}.
            </p>
          )}

          {datos.token.estado === "vencido" && (
            <p className="rounded-lg border border-[#f59e0b] bg-amber-50 p-3 text-amber-900">
              El código venció. Pedile al técnico que genere uno nuevo y volvé a intentar.
            </p>
          )}

          {datos.token.estado === "cancelado" && (
            <p className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-[#364152]">
              El código fue cancelado porque el trabajo se canceló.
            </p>
          )}

          {(datos.token.estado === "vencido" || datos.token.estado === "generado") && (
            <button
              type="button"
              onClick={cargar}
              className="w-full rounded-lg border border-[#1a73e8] px-4 py-3 font-semibold text-[#1a73e8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1447e6] focus:ring-offset-2"
            >
              Actualizar estado
            </button>
          )}
        </section>
      )}
    </main>
  );
}