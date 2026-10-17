import { useState } from 'react'
import { solicitarAutenticado } from '../../services/http'

export default function FotoPerfil({ usuario, onCambio }) {
  const [archivo, setArchivo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  async function guardar(quitar = false) {
    if (!quitar && !archivo) return
    setOcupado(true); setError(''); setMensaje('')
    try {
      const datos = new FormData()
      if (!quitar) datos.append('imagen', archivo)
      const resultado = await solicitarAutenticado('/usuarios/actual/foto/', { method: quitar ? 'DELETE' : 'POST', ...(quitar ? {} : { datos }) })
      onCambio({ ...usuario, ...resultado })
      setArchivo(null); setVersion(version + 1)
      setMensaje(quitar ? 'Foto quitada.' : 'Foto actualizada.')
    } catch (fallo) { setError(fallo.message) } finally { setOcupado(false) }
  }
  return <section className="mt-card space-y-3"><h2 className="text-lg font-bold">Foto de perfil</h2>
    <label htmlFor="foto-perfil" className="block">Elegir foto (opcional)</label>
    <input key={version} id="foto-perfil" type="file" accept="image/jpeg,image/png,image/webp" className="mt-file" disabled={ocupado} aria-describedby="foto-ayuda" onChange={(event) => {
      const elegida = event.target.files[0]
      setMensaje(''); setError('')
      if (elegida && (elegida.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(elegida.type))) { setArchivo(null); setError('Usá JPG, PNG o WEBP de hasta 5 MB.'); return }
      setArchivo(elegida || null)
    }} />
    <p id="foto-ayuda" className="text-sm text-slate-500">JPG, PNG o WEBP, hasta 5 MB. Se recorta al centro. La foto del técnico se muestra en su perfil y catálogo.</p>
    <div className="flex flex-wrap gap-3"><button type="button" className="mt-button" disabled={ocupado || !archivo} onClick={() => guardar()}>{ocupado ? 'Guardando…' : 'Guardar foto'}</button>{usuario.foto_perfil && <button type="button" className="secondary-button" disabled={ocupado} onClick={() => guardar(true)}>Quitar foto</button>}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}{mensaje && <p role="status" className="text-emerald-700">{mensaje}</p>}
  </section>
}
