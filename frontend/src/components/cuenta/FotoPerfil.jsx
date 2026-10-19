import { useRef, useState } from 'react'
import Avatar from '../comunes/Avatar'
import { solicitarAutenticado } from '../../services/http'

export default function FotoPerfil({ usuario, onCambio, onMensaje }) {
  const selector = useRef(null)
  const guardando = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const nombre =
    [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || usuario.username

  async function guardar(archivo, quitar = false) {
    if (guardando.current || (!quitar && !archivo)) return
    if (
      archivo &&
      (archivo.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type))
    ) {
      onMensaje({ error: true, texto: 'Usá JPG, PNG o WEBP de hasta 5 MB.' })
      return
    }
    guardando.current = true
    setOcupado(true)
    onMensaje({ error: false, texto: 'Guardando foto…' })
    try {
      const datos = new FormData()
      if (archivo) datos.append('imagen', archivo)
      const resultado = await solicitarAutenticado('/usuarios/actual/foto/', {
        method: quitar ? 'DELETE' : 'POST',
        ...(quitar ? {} : { datos }),
      })
      onCambio({ ...usuario, ...resultado })
      onMensaje({ error: false, texto: quitar ? 'Foto quitada.' : 'Foto actualizada.' })
    } catch (fallo) {
      onMensaje({ error: true, texto: fallo.message })
    } finally {
      guardando.current = false
      setOcupado(false)
    }
  }

  return (
    <div className="profile-photo-control">
      <input
        ref={selector}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={ocupado}
        onChange={(event) => {
          const archivo = event.target.files?.[0]
          event.target.value = ''
          if (archivo) guardar(archivo)
        }}
      />
      <button
        type="button"
        className="profile-photo-button"
        disabled={ocupado}
        aria-busy={ocupado}
        aria-label={ocupado ? 'Guardando foto de perfil' : 'Cambiar foto de perfil'}
        title="Cambiar foto de perfil"
        onClick={() => selector.current?.click()}
      >
        <Avatar ruta={usuario.foto_perfil} nombre={nombre} className="profile-avatar" />
        <span className="profile-photo-camera" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 6h5l2-3h4l2 3h5v15H3z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </button>
      {usuario.foto_perfil && (
        <button
          type="button"
          className="profile-photo-remove"
          disabled={ocupado}
          onClick={() => guardar(null, true)}
        >
          Quitar foto
        </button>
      )}
    </div>
  )
}
