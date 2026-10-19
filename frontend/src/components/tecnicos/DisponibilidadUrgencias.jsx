import { formatearDinero } from '../../utils/formato'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarAutenticado } from '../../services/http'

export default function DisponibilidadUrgencias() {
  const version = useRef(0)
  const [datos, setDatos] = useState(null)
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let activo = true
    let timer
    async function consultar() {
      const actual = version.current
      try {
        const resultado = await solicitarAutenticado('/urgencias/disponibilidad/')
        if (activo && actual === version.current) setDatos(resultado)
      } catch (e) {
        if (activo) setError(e.message)
      } finally {
        if (activo) timer = setTimeout(consultar, 5000)
      }
    }
    consultar()
    return () => {
      activo = false
      clearTimeout(timer)
    }
  }, [intento])
  async function cambiar() {
    version.current += 1
    setGuardando(true)
    setError('')
    try {
      setDatos(
        await solicitarAutenticado('/urgencias/disponibilidad/', {
          method: 'PATCH',
          datos: { activa: !datos.activa },
        }),
      )
      setIntento((v) => v + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      version.current += 1
      setGuardando(false)
    }
  }
  return (
    <section className="mt-card space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-1">
          <h2 className="font-bold text-lg">Urgencias</h2>
          <button
            type="button"
            className="urgency-info-button"
            aria-label="Información sobre urgencias y costo de visita"
            aria-expanded={mostrarInfo}
            aria-controls="informacion-urgencias"
            onClick={() => setMostrarInfo(!mostrarInfo)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v6" />
              <circle cx="12" cy="7.5" r=".8" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div className="availability-control">
          <span aria-live="polite" className="availability-label">
            {guardando
              ? 'Guardando…'
              : !datos
                ? 'Cargando…'
                : datos.activa
                  ? 'Disponible'
                  : 'No disponible'}
          </span>
          <button
            type="button"
            role="switch"
            aria-label="Disponibilidad para urgencias"
            aria-checked={datos?.activa ?? false}
            disabled={!datos || guardando || (!datos.habilitado && !datos.activa)}
            onClick={cambiar}
            className="availability-switch"
          >
            <span className="availability-thumb" aria-hidden="true" />
          </button>
        </div>
      </div>
      {mostrarInfo && (
        <div id="informacion-urgencias" className="rounded-xl bg-canvas p-4 text-sm space-y-2">
          <p className="font-semibold">Visita: {formatearDinero(datos?.tarifa_visita)}</p>
          <p>
            Al activarlo, aceptás recibir visitas asignadas automáticamente según tus zonas y
            especialidades. Los materiales y trabajos adicionales se acuerdan con el cliente.
          </p>
          <p>
            Al recibir una asignación, tu disponibilidad se desactiva. Desactivarla no cancela
            trabajos ya asignados.
          </p>
          <p>Mientras esté desactivado, no recibirás nuevas urgencias.</p>
          <Link
            className="inline-flex min-h-11 items-center text-brand font-semibold"
            to="/trabajos"
          >
            Ver mis trabajos →
          </Link>
        </div>
      )}
      {datos && !datos.habilitado && <p className="text-sm">Necesitás tener el perfil aprobado.</p>}
      {datos?.trabajo && (
        <p role="status">
          <Link className="mt-button inline-flex" to={`/trabajos/${datos.trabajo}`}>
            Tenés una urgencia asignada · Ver trabajo
          </Link>
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  )
}
