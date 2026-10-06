function MensajeError({ mensaje }) {
  if (!mensaje) return null

  return (
    <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm font-medium text-red-800">
      {mensaje}
    </p>
  )
}

export default MensajeError
