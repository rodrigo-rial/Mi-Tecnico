import { useEffect, useId, useRef } from 'react'

function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Volver',
  peligro = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  const idTitulo = useId()
  const botonCancelar = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined

    botonCancelar.current?.focus()

    function alPresionarTecla(evento) {
      if (evento.key === 'Escape' && !cargando) onCancelar()
    }

    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [abierto, cargando, onCancelar])

  if (!abierto) return null

  const claseConfirmar = peligro
    ? 'min-h-11 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
    : 'mt-button'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="mt-card max-w-md"
      >
        <h2 id={idTitulo} className="text-lg font-semibold text-ink">
          {titulo}
        </h2>
        {mensaje && <p className="mt-2 text-slate-600">{mensaje}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={botonCancelar}
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="min-h-11 rounded-lg border border-line bg-surface px-5 py-3 font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={claseConfirmar}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacion
