import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import LayoutPagina from '../components/comunes/LayoutPagina'
import MensajeError from '../components/comunes/MensajeError'
import Spinner from '../components/comunes/Spinner'
import SolicitudForm from '../components/solicitudes/SolicitudForm'
import { solicitarAutenticado } from '../services/http'
import { cargarCatalogos } from '../services/catalogos'
import { crearSolicitud } from '../services/solicitudesApi'
import { mensajeError } from '../utils/errores'
import { ENLACES_CLIENTE } from '../utils/navegacion'

function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const tecnicoId = parametros.get('tecnico')
  const [destinatario, setDestinatario] = useState(null)

  const [catalogos, setCatalogos] = useState({ especialidades: [], zonas: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let pantallaActiva = true

    Promise.all([
      cargarCatalogos(),
      tecnicoId
        ? solicitarAutenticado(`/tecnicos/${tecnicoId}/profesional/`)
        : Promise.resolve(null),
    ])
      .then(([datos, perfil]) => {
        if (!pantallaActiva) return
        setDestinatario(perfil)
        setCatalogos(
          perfil
            ? {
                especialidades: datos.especialidades.filter((item) =>
                  perfil.especialidad_ids.includes(item.id),
                ),
                zonas: datos.zonas.filter((item) => perfil.zona_ids.includes(item.id)),
              }
            : datos,
        )
        setError('')
      })
      .catch((errorCarga) => {
        if (!pantallaActiva) return
        if (errorCarga.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(mensajeError(errorCarga))
      })
      .finally(() => {
        if (pantallaActiva) setCargando(false)
      })

    return () => {
      pantallaActiva = false
    }
  }, [intento, navigate, tecnicoId])

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((valor) => valor + 1)
  }

  async function publicar(datos) {
    await crearSolicitud({
      ...datos,
      ...(tecnicoId ? { tecnico_destinatario: Number(tecnicoId) } : {}),
    })
    navigate('/cliente/solicitudes', {
      state: {
        mensaje: tecnicoId
          ? 'Pedido enviado al técnico. Esperá su propuesta para confirmar el servicio.'
          : 'Tu solicitud fue publicada. Los técnicos compatibles ya pueden verla.',
      },
    })
  }

  return (
    <LayoutPagina
      titulo="Nueva solicitud"
      descripcion={
        tecnicoId
          ? 'El técnico elegido te enviará su precio y disponibilidad antes de contratar.'
          : 'Contanos qué necesitás y los técnicos de tu zona te enviarán propuestas.'
      }
      enlaces={ENLACES_CLIENTE}
    >
      {destinatario && (
        <p className="mt-card">
          Pedido dirigido a <strong>{destinatario.nombre}</strong>. Solo este técnico podrá
          responder.
        </p>
      )}
      {cargando && <Spinner texto="Cargando el formulario..." />}

      {!cargando && error && (
        <section className="mt-card space-y-4">
          <MensajeError mensaje={error} />
          <button type="button" onClick={reintentar} className="mt-button">
            Volver a intentar
          </button>
        </section>
      )}

      {!cargando && !error && (
        <SolicitudForm
          especialidades={catalogos.especialidades}
          zonas={catalogos.zonas}
          onGuardar={publicar}
        />
      )}
    </LayoutPagina>
  )
}

export default NuevaSolicitudPage
