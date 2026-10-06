// Selector accesible: son radios reales (se usan con teclado y lector de pantalla).
export default function SelectorEstrellas({ valor, onChange, deshabilitado = false }) {
  return (
    <fieldset disabled={deshabilitado}>
      <legend className="mb-1 text-sm font-medium text-[#364152]">Puntaje</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-1">
            <input
              type="radio"
              name="puntaje"
              value={n}
              checked={valor === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`text-3xl peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#1447e6] ${
                n <= valor ? "text-[#f59e0b]" : "text-gray-300"
              }`}
            >
              ★
            </span>
            <span className="sr-only">
              {n} {n === 1 ? "estrella" : "estrellas"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}