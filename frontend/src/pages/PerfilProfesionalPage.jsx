import Avatar from '../components/comunes/Avatar'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import Estrellas from '../components/reputacion/Estrellas'
import { solicitarAutenticado } from '../services/http'
import { enlacesPorRol } from '../utils/navegacion'

function Perfil({ id }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let activo = true
    solicitarAutenticado(`/tecnicos/${id}/profesional/`)
      .then((valor) => {
        if (activo) setDatos(valor)
      })
      .catch((fallo) => {
        if (activo)
          setError(fallo.status === 404 ? 'Este perfil no está disponible.' : fallo.message)
      })
    return () => {
      activo = false
    }
  }, [id, intento])
  if (error)
    return (
      <div role="alert" className="mt-card">
        <p>{error}</p>
        <button
          className="secondary-button mt-3"
          onClick={() => {
            setError('')
            setIntento(intento + 1)
          }}
        >
          Reintentar
        </button>
      </div>
    )
  if (!datos) return <p role="status">Cargando perfil…</p>
  return (
    <>
      <section className="mt-card space-y-4 break-words">
        <Avatar ruta={datos.foto_perfil} nombre={datos.nombre} className="h-24 w-24" />
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-2xl font-bold">{datos.nombre}</h2>
          <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
            Técnico aprobado
          </span>
        </div>
        <p className="whitespace-pre-line">{datos.descripcion || 'Sin descripción profesional.'}</p>
        <Link className="mt-button inline-flex" to={`/cliente/solicitudes/nueva?tecnico=${id}`}>
          Solicitar servicio
        </Link>
        <h3 className="font-semibold">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {datos.especialidades.map((nombre) => (
            <span className="service-chip" key={nombre}>
              {nombre}
            </span>
          ))}
        </div>
        <h3 className="font-semibold">Zonas de cobertura</h3>
        <div className="flex flex-wrap gap-2">
          {datos.zonas.map((nombre) => (
            <span className="coverage-chip" key={nombre}>
              {nombre}
            </span>
          ))}
        </div>
      </section>
      <section className="mt-card space-y-4">
        <h2 className="text-xl font-bold">Calificaciones y reseñas</h2>
        {datos.reputacion.cantidad ? (
          <div className="flex flex-wrap gap-2">
            <Estrellas valor={datos.reputacion.promedio} />
            <span>
              {Number(datos.reputacion.promedio).toLocaleString('es-AR', {
                maximumFractionDigits: 1,
              })}{' '}
              / 5 · {datos.reputacion.cantidad}{' '}
              {datos.reputacion.cantidad === 1 ? 'calificación' : 'calificaciones'}
            </span>
          </div>
        ) : (
          <p>Sin calificaciones todavía.</p>
        )}
        {datos.resenas.map((resena) => (
          <article key={resena.id} className="border-t border-line pt-4">
            <Estrellas valor={resena.puntaje} />
            <p className="mt-2 whitespace-pre-line break-words">
              {resena.comentario || 'Sin comentario.'}
            </p>
            <time className="text-sm text-slate-500" dateTime={resena.created_at}>
              {new Date(resena.created_at).toLocaleDateString('es-AR')}
            </time>
          </article>
        ))}
      </section>
      <section className="mt-card space-y-4">
        <h2 className="text-xl font-bold">Trabajos terminados</h2>
        {!datos.fotos.length && <p>Todavía no hay fotos.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {datos.fotos.map((foto) => (
            <figure key={foto.id}>
              <a href={foto.imagen} target="_blank" rel="noreferrer">
                <img
                  className="h-48 w-full rounded-xl object-contain bg-canvas"
                  src={foto.imagen}
                  alt={foto.descripcion || 'Trabajo terminado'}
                  loading="lazy"
                />
              </a>
              <figcaption className="mt-2 break-words text-sm">{foto.descripcion}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  )
}

export default function PerfilProfesionalPage() {
  const { id } = useParams()
  return (
    <LayoutPagina titulo="Perfil profesional" enlaces={enlacesPorRol('CLIENTE')}>
      <Link className="inline-flex min-h-11 items-center text-brand" to="/cliente/solicitudes">
        Volver a mis solicitudes
      </Link>
      <Perfil key={id} id={id} />
    </LayoutPagina>
  )
}
