import { useEffect, useState } from 'react'

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

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            MiTécnico
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Panel del técnico</h1>
              <p className="mt-2 max-w-2xl text-blue-100">
                Completá tu información profesional y enviá la documentación para revisión.
              </p>
            </div>
            {estado && (
              <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${estilosEstado[estado]}`}>
                {etiquetasEstado[estado]}
              </span>
            )}
          </div>
        </header>

        {cargando && (
          <section role="status" className="mt-card text-center text-ink">
            Cargando tu información…
          </section>
        )}

        {!cargando && error && (
          <section role="alert" className="rounded-xl border border-danger bg-red-50 p-6">
            <h2 className="font-bold text-red-800">No pudimos cargar el panel</h2>
            <p className="mt-2 text-red-700">{error}</p>
            <button type="button" onClick={reintentarCarga}
              className="mt-button mt-4">
              Volver a intentar
            </button>
          </section>
        )}

        {!cargando && !error && (
          <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-8">
              <PerfilTecnicoForm
                key={perfil?.id ?? 'perfil-nuevo'}
                perfil={perfil ?? {}}
                especialidades={especialidades}
                zonas={zonas}
                onGuardar={guardarPerfil}
              />
              {perfil && documentacion && (
                <DocumentacionTecnicoForm
                  key={`${perfil.id}-${documentacion.actualizado_en ?? 'documentacion'}`}
                  documentacion={documentacion}
                  onGuardar={guardarDocumentacion}
                />
              )}
            </div>

            <aside className="mt-card h-fit">
              <h2 className="text-lg font-bold text-ink">Pasos para validar tu perfil</h2>
              <ol className="mt-4 space-y-4 text-sm text-ink">
                <li><strong className="text-brand">1.</strong> Completá tu perfil profesional.</li>
                <li><strong className="text-brand">2.</strong> Cargá DNI y matrícula.</li>
                <li><strong className="text-brand">3.</strong> Esperá la revisión del administrador.</li>
              </ol>
              {!perfil && (
                <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  Primero guardá el perfil para habilitar la documentación.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
