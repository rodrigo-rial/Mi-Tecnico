import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../../services/authApi'

export default function LayoutPagina({ titulo, descripcion, enlaces = [], conCerrarSesion = true, children }) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const menu = useRef(null)
  const boton = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!abierto) return
    function cerrarFuera(event) {
      if (!menu.current?.contains(event.target)) setAbierto(false)
    }
    function cerrarConEscape(event) {
      if (event.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', cerrarFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])
  const tecnico = enlaces.some(({ to }) => to === '/tecnico/solicitudes')
  return (
    <div className="app-shell">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:p-4">Ir al contenido</a>
      <header className="app-topbar">
        <Link to={enlaces.length === 0 ? '/cuenta' : tecnico ? '/tecnico/solicitudes' : '/cliente/solicitudes'} className="app-logo">
          <img src="/mitecnico-logo.png" alt="" className="brand-image" />MiTécnico
        </Link>
        <div className="account-menu" ref={menu} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setAbierto(false)
        }}>
          <button ref={boton} type="button" className="account-menu-trigger" aria-label="Menú de usuario" aria-expanded={abierto} aria-controls={menuId} onClick={() => setAbierto(!abierto)}>
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>
          </button>
          {abierto && <div id={menuId} className="account-menu-panel">
            <Link to="/cuenta" onClick={() => setAbierto(false)}>Mi cuenta</Link>
            {conCerrarSesion && <button type="button" onClick={() => { cerrarSesion(); setAbierto(false); navigate('/login', { replace: true }) }}>Cerrar sesión</button>}
          </div>}
        </div>
      </header>
      <div className="app-body">
        <div className="section-bar">
          <nav aria-label="Navegación principal" className="app-navigation">
            {enlaces.map(({ to, texto, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}>
                {texto}
              </NavLink>
            ))}
          </nav>
        </div>
        <main id="contenido" className="app-content">
          <header className="page-heading"><h1>{titulo}</h1>{descripcion && <p>{descripcion}</p>}</header>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
