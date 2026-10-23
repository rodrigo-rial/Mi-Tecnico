import Estrellas from './Estrellas'

export default function ResenasProfesional({ reputacion, resenas }) {
  return (
    <section className="mt-card space-y-4">
      <h2 className="text-xl font-bold">Calificaciones y reseñas</h2>
      {reputacion.cantidad ? (
        <div className="flex flex-wrap gap-2">
          <Estrellas valor={reputacion.promedio} />
          <span>
            {Number(reputacion.promedio).toLocaleString('es-AR', {
              maximumFractionDigits: 1,
            })}{' '}
            / 5 · {reputacion.cantidad}{' '}
            {reputacion.cantidad === 1 ? 'calificación' : 'calificaciones'}
          </span>
        </div>
      ) : (
        <p>Sin calificaciones todavía.</p>
      )}
      {resenas.map((resena) => (
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
  )
}
