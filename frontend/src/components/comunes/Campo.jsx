/** Etiqueta + control + ayuda o mensaje de error de un campo de formulario. */
function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-ink">
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="mt-1 text-sm text-slate-600">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default Campo
