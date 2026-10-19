import { formatearDinero } from '../../utils/formato'

export default function FormularioUrgencia({
  datos,
  especialidades,
  zonas,
  tarifa,
  enviando,
  onCambio,
  onEnviar,
}) {
  return (
    <form className="mt-card space-y-4" onSubmit={onEnviar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Especialidad
          <select
            name="especialidad"
            required
            value={datos.especialidad}
            onChange={onCambio}
            className="mt-input"
          >
            <option value="">Seleccioná un servicio</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zona
          <select name="zona" required value={datos.zona} onChange={onCambio} className="mt-input">
            <option value="">Seleccioná tu zona</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        Dirección
        <input
          name="direccion"
          required
          maxLength={255}
          value={datos.direccion}
          onChange={onCambio}
          className="mt-input"
          autoComplete="street-address"
        />
      </label>
      <label className="block">
        ¿Qué pasó?
        <textarea
          name="descripcion"
          required
          maxLength={2000}
          value={datos.descripcion}
          onChange={onCambio}
          className="mt-input"
          rows={3}
        />
      </label>
      <p className="text-sm">
        Al confirmar, autorizás la asignación automática con esta tarifa de visita. Si el técnico
        cancela, buscaremos otro sin que tengas que repetir el pedido.
      </p>
      <button
        className="mt-button"
        disabled={enviando || tarifa === null || !especialidades.length || !zonas.length}
      >
        {enviando
          ? 'Buscando…'
          : tarifa === null
            ? 'Cargando tarifa…'
            : `Confirmar visita de ${formatearDinero(tarifa)}`}
      </button>
    </form>
  )
}
