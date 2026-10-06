import { NavLink } from 'react-router-dom'

function LayoutPagina({ titulo, descripcion, enlaces = [], children }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            MiTécnico
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{titulo}</h1>
          {descripcion && (
            <p className="mt-2 max-w-2xl text-blue-100">{descripcion}</p>
          )}

          {enlaces.length > 0 && (
            <nav aria-label="Navegación principal" className="mt-5 flex flex-wrap gap-2">
              {enlaces.map(({ to, texto, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-brand'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                >
                  {texto}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        {children}
      </div>
    </main>
  )
}

export default LayoutPagina
