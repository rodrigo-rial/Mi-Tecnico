import { useState } from 'react'
import EditarCuenta from '../components/cuenta/EditarCuenta'
import ResumenReputacion from '../components/reputacion/ResumenReputacion'
import { Link } from 'react-router-dom'
import LayoutPagina from '../components/comunes/LayoutPagina'
import { useUsuarioActual } from '../hooks/useUsuarioActual'
import { enlacesPorRol } from '../utils/navegacion'

export default function CuentaPage() {
  const { usuario, cargando, actualizarUsuario } = useUsuarioActual()
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState('')
  const tecnico = usuario?.rol === 'TECNICO'
  const nombre = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.username || 'Mi cuenta'
  const rol = { CLIENTE: 'Cliente', TECNICO: 'Técnico', ADMINISTRADOR: 'Administrador' }[usuario?.rol]
  return (
    <LayoutPagina titulo="Mi cuenta" descripcion="Tu información personal, en un solo lugar." enlaces={enlacesPorRol(usuario?.rol)}>
      {cargando ? <p role="status">Cargando tu cuenta…</p> : !usuario ? <div role="alert" className="mt-card">No pudimos cargar tu cuenta. <Link className="text-brand underline" to="/login">Volver a iniciar sesión</Link></div> : <>
        <section className="profile-cover"><div className="profile-cover-art" aria-hidden="true"/><div className="profile-identity"><div className="profile-avatar" aria-hidden="true">{nombre.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="eyebrow">TU PERFIL</p><h2 className="break-words">{nombre}</h2><p className="text-slate-500 break-all">@{usuario.username}</p></div><span className="role-pill">{rol}</span></div></section>
        <div className="profile-columns">
          <section className="mt-card"><p className="eyebrow">INFORMACIÓN PERSONAL</p><h2 className="text-xl font-bold mt-2">Los datos de tu cuenta</h2>{aviso && <p role="status" className="text-emerald-700 mt-3">{aviso}</p>}
          {editando ? <EditarCuenta usuario={usuario} onCancelar={() => setEditando(false)} onGuardado={(cuenta) => { actualizarUsuario(cuenta); setEditando(false); setAviso('Datos guardados correctamente.') }} /> : <><button className="secondary-button mt-4" type="button" onClick={() => { setAviso(''); setEditando(true) }}>Editar datos</button><dl className="account-fields">
            <div><dt>Nombre completo</dt><dd>{[usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || 'No informado'}</dd></div>
            <div><dt>Nombre de usuario</dt><dd>@{usuario.username}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{usuario.email || 'No informado'}</dd></div>
            <div><dt>Tipo de cuenta</dt><dd>{rol}</dd></div>
            <div><dt>Teléfono</dt><dd>{usuario.telefono || 'No informado'}</dd></div>
            <div><dt>Domicilio de referencia</dt><dd className="break-words">{usuario.domicilio_referencia || 'No informado'}</dd></div>
          </dl></>}</section>
          <aside className="space-y-4">{usuario.rol !== 'ADMINISTRADOR' && <section className="mt-card space-y-3"><h2 className="text-lg font-bold">Mi reputación</h2><ResumenReputacion usuarioId={usuario.id} /></section>}<section className="mt-card"><h2 className="font-bold text-lg">{tecnico ? 'Tu espacio profesional' : 'Todo a mano'}</h2><p className="text-sm text-slate-500 mt-2">{tecnico ? 'Gestioná tu presentación, servicios y zonas de cobertura.' : 'Consultá tus pedidos y seguí los servicios que ya coordinaste.'}</p>{usuario.rol !== 'ADMINISTRADOR' && <Link className="quick-link" to={tecnico ? '/tecnico' : '/cliente/solicitudes'}>{tecnico ? 'Ver mi perfil profesional' : 'Ver mis solicitudes'} <span aria-hidden="true">→</span></Link>}{usuario.rol !== 'ADMINISTRADOR' && <Link className="quick-link" to="/trabajos">{tecnico ? 'Mis trabajos' : 'Servicios contratados'} <span aria-hidden="true">→</span></Link>}</section></aside>
        </div>
      </>}
    </LayoutPagina>
  )
}
