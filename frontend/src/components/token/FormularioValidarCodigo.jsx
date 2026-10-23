import { useState } from 'react'
import { validarToken } from '../../services/tokenService'
import { mensajeError } from '../../utils/errores'

export default function FormularioValidarCodigo({ trabajoId, onValidado }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alEscribir(evento) {
    // Solo números, máximo 6.
    setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setError('')
    // Comodidad para la persona; la validación real la hace el backend.
    if (codigo.length !== 6) {
      setError('El código tiene que ser de 6 números.')
      return
    }
    setEnviando(true)
    try {
      const datos = await validarToken(trabajoId, codigo)
      onValidado?.(datos)
    } catch (e) {
      // Acá llegan: código incorrecto (con intentos restantes), vencido, usado y bloqueo.
      setError(mensajeError(e))
      setCodigo('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div>
        <label htmlFor="codigo" className="block text-sm font-medium text-[#364152]">
          Código de seguridad
        </label>
        <p id="ayuda-codigo" className="text-sm text-[#364152]">
          Pedile al técnico el código de 6 números que ve en su pantalla.
        </p>
        <input
          id="codigo"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          value={codigo}
          onChange={alEscribir}
          aria-describedby={error ? 'ayuda-codigo error-codigo' : 'ayuda-codigo'}
          aria-invalid={error ? 'true' : 'false'}
          className="mt-2 w-full rounded-lg border border-gray-400 p-3 text-center text-3xl tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#1447e6]"
        />
      </div>

      {error && (
        <p
          id="error-codigo"
          role="alert"
          className="rounded-lg border border-[#ef4444] bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-[#1a73e8] px-4 py-3 font-semibold text-white hover:bg-[#1447e6] focus:outline-none focus:ring-2 focus:ring-[#1447e6] focus:ring-offset-2 disabled:opacity-60"
      >
        {enviando ? 'Verificando…' : 'Validar código'}
      </button>
    </form>
  )
}
