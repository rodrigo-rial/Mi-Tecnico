// Reutilizable: sirve para un trabajo o para el historial completo de un técnico.
export default function GaleriaFotos({ fotos }) {
  if (fotos.length === 0) {
    return <p className="text-sm text-[#364152]">Todavía no hay fotos.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {fotos.map((foto) => (
        <li key={foto.id}>
          <img
            src={foto.imagen}
            alt={foto.descripcion || "Foto del trabajo realizado"}
            loading="lazy"
            className="aspect-square w-full rounded-lg object-cover"
          />
          {foto.descripcion && (
            <p className="mt-1 text-xs text-[#364152]">{foto.descripcion}</p>
          )}
        </li>
      ))}
    </ul>
  );
}