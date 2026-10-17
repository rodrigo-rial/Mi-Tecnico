import ResumenReputacion from '../components/reputacion/ResumenReputacion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { ENLACES_TECNICO } from '../utils/navegacion'
import { useUsuarioActual } from '../hooks/useUsuarioActual'

import DocumentacionTecnicoForm from '../components/tecnicos/DocumentacionTecnicoForm'
import PerfilTecnicoForm from '../components/tecnicos/PerfilTecnicoForm'
import {
  actualizarDocumentacionTecnico,
  actualizarPerfilTecnico,
  crearPerfilTecnico,
  obtenerDocumentacionTecnico,
  obtenerEspecialidades,
  obtenerPerfilTecnico,
  obtenerZonas,
} from '../services/tecnicosApi'

const estilosEstado = {
  PENDIENTE: 'border border-warning bg-amber-50 text-amber-900',
  APROBADO: 'border border-success bg-emerald-50 text-emerald-900',
  RECHAZADO: 'border border-danger bg-red-50 text-red-900',
}

const etiquetasEstado = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADO: 'Perfil aprobado',
  RECHAZADO: 'Documentación rechazada',
}

async function solicitarDatosPanel(token) {
  const [especialidades, zonas] = await Promise.all([
    obtenerEspecialidades(token),
    obtenerZonas(token),
  ])

  let perfil
  try {
    perfil = await obtenerPerfilTecnico(token)
  } catch (solicitudError) {
    if (solicitudError.status === 404) {
      return {
        especialidades,
        zonas,
        perfil: null,
        documentacion: null,
      }
    }
    throw solicitudError
  }
  const documentacion = await obtenerDocumentacionTecnico(token)
  return { especialidades, zonas, perfil, documentacion }
}

export default function PanelTecnico({ token }) {
  const { usuario } = useUsuarioActual()
  const [editando, setEditando] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [documentacion, setDocumentacion] = useState(null)
  const [especialidades, setEspecialidades] = useState([])
  const [zonas, setZonas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return undefined

    let pantallaActiva = true
    solicitarDatosPanel(token)
      .then((datos) => {
        if (!pantallaActiva) return
        setEspecialidades(datos.especialidades)
        setZonas(datos.zonas)
        setPerfil(datos.perfil)
        setDocumentacion(datos.documentacion)
        setError('')
      })
      .catch((solicitudError) => {
        if (pantallaActiva) setError(solicitudError.message)
      })
      .finally(() => {
        if (pantallaActiva) setCargando(false)
      })

    return () => {
      pantallaActiva = false
    }
  }, [token])

  async function reintentarCarga() {
    setCargando(true)
    setError('')
    try {
      const datos = await solicitarDatosPanel(token)
      setEspecialidades(datos.especialidades)
      setZonas(datos.zonas)
      setPerfil(datos.perfil)
      setDocumentacion(datos.documentacion)
    } catch (solicitudError) {
      setError(solicitudError.message)
    } finally {
      setCargando(false)
    }
  }

  async function guardarPerfil(datos) {
    const perfilGuardado = perfil
      ? await actualizarPerfilTecnico(token, datos)
      : await crearPerfilTecnico(token, datos)
    setPerfil(perfilGuardado)

    if (!documentacion) {
      const documentacionCargada = await obtenerDocumentacionTecnico(token)
      setDocumentacion(documentacionCargada)
    }
  }

  async function guardarDocumentacion(formulario) {
    const documentacionGuardada = await actualizarDocumentacionTecnico(
      token,
      formulario,
    )
    setDocumentacion(documentacionGuardada)
    setPerfil((perfilActual) => ({
      ...perfilActual,
      estado_validacion: documentacionGuardada.estado_validacion,
    }))
    return documentacionGuardada
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-12">
        <section className="mx-auto max-w-xl mt-card text-center">
          <h1 className="text-3xl font-bold text-brand">Panel del técnico</h1>
          <p className="mt-4 text-ink">
            Iniciá sesión con una cuenta de técnico para administrar tu perfil.
          </p>
        </section>
      </main>
    )
  }

  const estado = perfil?.estado_validacion

  const aprobado = estado === 'APROBADO'
  const nombre = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.username || 'Mi perfil profesional'
  const servicios = especialidades.filter(({ id }) => perfil?.especialidades?.includes(id))
  const cobertura = zonas.filter(({ id }) => perfil?.zonas?.includes(id))

  return (
    <LayoutPagina titulo="Mi perfil profesional" descripcion="Tu oficio, tu experiencia y los lugares donde trabajás." enlaces={ENLACES_TECNICO}>
      {cargando && <p role="status" className="mt-card">Cargando tu perfil…</p>}
      {!cargando && error && <section role="alert" className="mt-card"><h2 className="font-bold">No pudimos cargar tu perfil</h2><p>{error}</p><button onClick={reintentarCarga} className="mt-button mt-4">Volver a intentar</button></section>}
      {!cargando && !error && <>
        <section className="profile-cover">
          <div className="profile-cover-art professional-cover" aria-hidden="true"></div>
          <div className="profile-identity"><div className="profile-avatar" aria-hidden="true">{nombre.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h2 className="break-words">{nombre}</h2><p className="text-slate-500 mt-1">{servicios.map(({ nombre: servicio }) => servicio).join(' · ') || 'Profesional de MiTécnico'}</p></div>{estado && <span className={`role-pill ${estilosEstado[estado]}`}>{aprobado ? '✓ Técnico verificado' : etiquetasEstado[estado]}</span>}</div>
        </section>
        <div className="profile-columns">
          <div className="space-y-5 min-w-0">
            {perfil && <section className="mt-card"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Acerca de mí</h2><button type="button" className="secondary-button" aria-expanded={editando} onClick={() => setEditando(!editando)}>{editando ? 'Cerrar edición' : 'Editar perfil'}</button></div><p className="mt-4 whitespace-pre-line break-words text-slate-600">{perfil.descripcion || 'Agregá una descripción para contar tu experiencia y los servicios que ofrecés.'}</p><h3 className="font-semibold mt-6 mb-3">Mis especialidades</h3><div className="flex flex-wrap gap-2">{servicios.map(({ id, nombre: servicio }) => <span className="service-chip" key={id}>{servicio}</span>)}</div><h3 className="font-semibold mt-6 mb-3">Dónde trabajo</h3><div className="flex flex-wrap gap-2">{cobertura.map(({ id, nombre: zona }) => <span className="coverage-chip" key={id}>{zona}</span>)}</div></section>}
            {(!perfil || editando || !aprobado) && <PerfilTecnicoForm key={perfil?.id ?? 'perfil-nuevo'} perfil={perfil ?? {}} especialidades={especialidades} zonas={zonas} onGuardar={guardarPerfil} />}
            {perfil && documentacion && (aprobado ? <details className="mt-card"><summary className="cursor-pointer font-semibold min-h-11">Documentación verificada <span className="text-sm font-normal text-slate-500">· Ver opciones</span></summary><p className="mb-4 text-sm text-slate-600">Tu documentación ya está aprobada. Si necesitás actualizarla, el perfil volverá a revisión.</p><DocumentacionTecnicoForm documentacion={documentacion} onGuardar={guardarDocumentacion} /></details> : <DocumentacionTecnicoForm documentacion={documentacion} onGuardar={guardarDocumentacion} />)}
          </div>
          <aside className="space-y-5">
            {usuario && <section className="mt-card space-y-3"><h2 className="text-lg font-bold">Mi reputación</h2><ResumenReputacion usuarioId={usuario.id} /></section>}
            <section className="mt-card"><span className="eyebrow">{aprobado ? 'LISTO PARA TRABAJAR' : 'TU VERIFICACIÓN'}</span><h2 className="font-bold text-xl mt-3">{aprobado ? 'Solicitudes disponibles' : estado === 'RECHAZADO' ? 'Revisá tu documentación' : 'Completar verificación'}</h2><p className="text-sm text-slate-500 mt-3">{aprobado ? 'Explorá solicitudes que coinciden con tus servicios y tu zona.' : 'Completá tu perfil y adjuntá DNI y matrícula. El equipo revisará tu documentación antes de habilitar las propuestas.'}</p>{aprobado && <Link to="/tecnico/solicitudes" className="mt-button mt-5 inline-flex">Ver solicitudes <span className="ml-3" aria-hidden="true">→</span></Link>}</section>
            <section className="mt-card"><h2 className="font-bold">Mi actividad</h2><Link className="quick-link" to="/tecnico/propuestas">Mis propuestas <span aria-hidden="true">→</span></Link><Link className="quick-link" to="/trabajos">Mis trabajos <span aria-hidden="true">→</span></Link><Link className="quick-link" to="/cuenta">Datos de mi cuenta <span aria-hidden="true">→</span></Link></section>
          </aside>
        </div>
      </>}
    </LayoutPagina>
  )
}
