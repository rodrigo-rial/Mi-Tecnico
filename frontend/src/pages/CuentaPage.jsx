import PanelTecnico from './PanelTecnico'
import FotoPerfil from '../components/cuenta/FotoPerfil'
import { useState } from 'react'
import DatosCuenta from '../components/cuenta/DatosCuenta'
import ResumenReputacion from '../components/reputacion/ResumenReputacion'
import { Link } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { useUsuarioActual } from '../hooks/useUsuarioActual'
import { enlacesPorRol } from '../utils/navegacion'

export default function CuentaPage() {
  const { usuario, cargando, actualizarUsuario } = useUsuarioActual()
  const [avisoFoto, setAvisoFoto] = useState(null)
  const tecnico = usuario?.rol === 'TECNICO'
  const nombre =
    [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') ||
    usuario?.username ||
    'Mi cuenta'
  const rol = { CLIENTE: 'Cliente', TECNICO: 'Técnico', ADMINISTRADOR: 'Administrador' }[
    usuario?.rol
  ]
  return (
    <LayoutPagina
      titulo="Mi cuenta"
      descripcion="Tu información personal, en un solo lugar."
      enlaces={enlacesPorRol(usuario?.rol)}
    >
      {cargando ? (
        <p role="status">Cargando tu cuenta…</p>
      ) : !usuario ? (
        <div role="alert" className="mt-card">
          No pudimos cargar tu cuenta.{' '}
          <Link className="text-brand underline" to="/login">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <section className="profile-cover">
            <div className="profile-cover-art" aria-hidden="true" />
            <div className="profile-identity">
              <FotoPerfil usuario={usuario} onCambio={actualizarUsuario} onMensaje={setAvisoFoto} />
              <div className="min-w-0">
                <p className="eyebrow">TU PERFIL</p>
                <h2 className="break-words">{nombre}</h2>
                <p className="text-slate-500 break-all">@{usuario.username}</p>
              </div>
              <span className="role-pill">{rol}</span>
            </div>
          </section>
          {avisoFoto && (
            <p
              role={avisoFoto.error ? 'alert' : 'status'}
              className={avisoFoto.error ? 'text-red-700' : 'text-emerald-700'}
            >
              {avisoFoto.texto}
            </p>
          )}
          <div className="profile-columns">
            <DatosCuenta usuario={usuario} rol={rol} onCambio={actualizarUsuario} />
            <aside className="space-y-4">
              {usuario.rol !== 'ADMINISTRADOR' && (
                <section className="mt-card space-y-3">
                  <h2 className="text-lg font-bold">Mi reputación</h2>
                  <ResumenReputacion usuarioId={usuario.id} />
                </section>
              )}
              <section className="mt-card">
                <h2 className="font-bold text-lg">
                  {tecnico ? 'Tu espacio profesional' : 'Todo a mano'}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {tecnico
                    ? 'Gestioná tu presentación, servicios y zonas de cobertura.'
                    : 'Consultá tus pedidos y seguí los servicios que ya coordinaste.'}
                </p>
                {usuario.rol !== 'ADMINISTRADOR' &&
                  (tecnico ? (
                    <a className="quick-link" href="#perfil-profesional">
                      Datos profesionales <span aria-hidden="true">↓</span>
                    </a>
                  ) : (
                    <Link className="quick-link" to="/cliente/solicitudes">
                      Ver mis solicitudes <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                {usuario.rol !== 'ADMINISTRADOR' && (
                  <Link className="quick-link" to="/trabajos">
                    {tecnico ? 'Mis trabajos' : 'Servicios contratados'}{' '}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </section>
            </aside>
          </div>
          {tecnico && (
            <section id="perfil-profesional">
              <PanelTecnico integrado />
            </section>
          )}
        </>
      )}
    </LayoutPagina>
  )
}
