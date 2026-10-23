function Spinner({ texto = 'Cargando...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-6 text-ink">
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand"
      />
      <span>{texto}</span>
    </div>
  )
}

export default Spinner
