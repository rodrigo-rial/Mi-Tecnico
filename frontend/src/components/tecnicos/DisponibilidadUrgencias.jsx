import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarAutenticado } from '../../services/http'

export default function DisponibilidadUrgencias() {
  const version = useRef(0)
  const [datos, setDatos] = useState(null)
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
      } catch (e) { if (activo) setError(e.message) }
      finally { if (activo) timer = setTimeout(consultar, 5000) }
    }
    consultar()
    return () => { activo = false; clearTimeout(timer) }
  }, [intento])
  async function cambiar() {
    version.current += 1
    setGuardando(true); setError('')
    try {
      setDatos(await solicitarAutenticado('/urgencias/disponibilidad/', { method: 'PATCH', datos: { activa: !datos.activa } }))
      setIntento((v) => v + 1)
    } catch (e) { setError(e.message) }
    finally { version.current += 1; setGuardando(false) }
  }
  return <section className="mt-card space-y-3">
    <div className="flex flex-wrap justify-between items-center gap-4">
      <h2 className="font-bold text-lg">Urgencias · visita de $40.000</h2>
      <div className="availability-control">
        <span aria-live="polite" className="availability-label">{guardando ? 'Guardando…' : !datos ? 'Cargando…' : datos.activa ? 'Disponible' : 'No disponible'}</span>
        <button type="button" role="switch" aria-label="Disponibilidad para urgencias" aria-checked={datos?.activa ?? false}
          aria-describedby="ayuda-disponibilidad" disabled={!datos || guardando || (!datos.habilitado && !datos.activa)}
          onClick={cambiar} className="availability-switch"><span className="availability-thumb" aria-hidden="true" /></button>
      </div>
    </div>
    <p id="ayuda-disponibilidad" className="text-sm text-slate-600">{datos?.activa ? 'Activado: podés recibir urgencias de tus especialidades y zonas.' : 'Desactivado: no recibirás nuevas urgencias. Activá el interruptor para estar disponible.'}</p>
    <p className="text-sm">Al activarlo, aceptás recibir una visita asignada automáticamente en tus zonas y especialidades. Los adicionales se acuerdan con el cliente.</p>
    {datos && !datos.habilitado && <p className="text-sm">Necesitás tener el perfil aprobado.</p>}
    <p className="text-sm">Una asignación desactiva tu disponibilidad. Desactivarla no cancela un trabajo ya asignado.</p>
    {datos?.trabajo ? <p role="status"><Link className="mt-button inline-flex" to={`/trabajos/${datos.trabajo}`}>Tenés una urgencia asignada · Ver trabajo</Link></p> : <Link className="text-brand font-semibold" to="/trabajos">Ver mis trabajos →</Link>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>
}
