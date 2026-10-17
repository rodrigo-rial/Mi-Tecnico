// Estrellas de solo lectura. El lector de pantalla lee "4 de 5 estrellas".
export default function Estrellas({ valor = 0, tamano = "text-xl" }) {
  const llenas = Math.round(valor);
  return (
    <span
      className={`${tamano} text-[#f59e0b]`}
      role="img"
      aria-label={`${valor} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true">
          {n <= llenas ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}