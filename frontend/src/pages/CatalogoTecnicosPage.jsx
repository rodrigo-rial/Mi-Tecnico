import Avatar from '../components/comunes/Avatar'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { ENLACES_CLIENTE } from '../utils/navegacion'
import { cargarCatalogos } from '../services/catalogos'
import { solicitarAutenticado } from '../services/http'

function Resultados({ filtros }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let activo = true
    const params = new URLSearchParams({ page: pagina })
    for (const [campo, valor] of Object.entries(filtros)) if (valor) params.set(campo, valor)
    solicitarAutenticado(`/tecnicos/catalogo/?${params}`).then((valor) => {
      if (activo) setDatos(valor)
    }).catch((fallo) => { if (activo) setError(fallo.message) })
    return () => { activo = false }
  }, [filtros, pagina, intento])
  function ir(numero) { setDatos(null); setError(''); setPagina(numero) }
  if (error) return <div role="alert"><p>{error}</p><button className="secondary-button" onClick={() => { setError(''); setIntento(intento + 1) }}>Reintentar</button></div>
  if (!datos) return <p role="status">Buscando técnicos…</p>
  return <><p role="status">{datos.count} técnicos encontrados</p>
    {!datos.results.length && <p className="mt-card">No encontramos técnicos con esos filtros. Probá otra zona o especialidad.</p>}
    <div className="grid gap-4 md:grid-cols-2">{datos.results.map((tecnico) => <article className="mt-card space-y-3 break-words" key={tecnico.id}>
      <Avatar ruta={tecnico.foto_perfil} nombre={tecnico.nombre} />
      <h2 className="text-xl font-bold">{tecnico.nombre}</h2><p className="text-sm text-emerald-700">Técnico aprobado</p>
      <p>{tecnico.especialidades.join(' · ')}</p><p className="text-sm text-slate-600">{tecnico.zonas.join(' · ')}</p>
      <p>{tecnico.cantidad ? `${Number(tecnico.promedio).toLocaleString('es-AR', { maximumFractionDigits: 1 })} / 5 · ${tecnico.cantidad} calificaciones` : 'Sin calificaciones todavía.'}</p>
      <div className="flex flex-wrap gap-3"><Link className="secondary-button" to={`/cliente/tecnicos/${tecnico.id}`}>Ver perfil</Link><Link className="mt-button" to={`/cliente/solicitudes/nueva?tecnico=${tecnico.id}`}>Solicitar servicio</Link></div>
    </article>)}</div>
    <nav aria-label="Páginas de técnicos" className="flex items-center gap-3"><button className="secondary-button disabled:opacity-50" disabled={!datos.previous} onClick={() => ir(pagina - 1)}>Anterior</button><span>Página {pagina}</span><button className="secondary-button disabled:opacity-50" disabled={!datos.next} onClick={() => ir(pagina + 1)}>Siguiente</button></nav>
  </>
}

export default function CatalogoTecnicosPage() {
  const [catalogos, setCatalogos] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [filtros, setFiltros] = useState({ zona: '', especialidad: '' })
  useEffect(() => {
    let activo = true
    cargarCatalogos().then((datos) => { if (activo) setCatalogos(datos) }).catch((fallo) => { if (activo) setError(fallo.message) })
    return () => { activo = false }
  }, [intento])
  return <LayoutPagina titulo="Buscar técnicos" descripcion="Elegí tu zona y el servicio que necesitás." enlaces={ENLACES_CLIENTE}>
    {error ? <div role="alert"><p>{error}</p><button className="secondary-button" onClick={() => { setError(''); setIntento(intento + 1) }}>Reintentar</button></div> : !catalogos ? <p role="status">Cargando filtros…</p> : <>
      <div className="mt-card grid gap-4 sm:grid-cols-2">{[['zona', 'Zona', catalogos.zonas], ['especialidad', 'Especialidad', catalogos.especialidades]].map(([campo, etiqueta, opciones]) => <label key={campo}>{etiqueta}<select className="mt-input" value={filtros[campo]} onChange={(event) => setFiltros({ ...filtros, [campo]: event.target.value })}><option value="">Todas</option>{opciones.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>)}</div>
      <Resultados key={JSON.stringify(filtros)} filtros={filtros} />
    </>}
  </LayoutPagina>
}
