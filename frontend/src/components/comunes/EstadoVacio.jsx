function EstadoVacio({ titulo, descripcion, children }) {
  return (
    <div className="mt-card text-center">
      <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
      {descripcion && <p className="mt-2 text-sm text-slate-600">{descripcion}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  )
}

export default EstadoVacio
