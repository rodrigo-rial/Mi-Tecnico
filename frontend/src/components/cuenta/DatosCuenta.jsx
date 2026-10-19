import { useState } from 'react'
import EditarCuenta from './EditarCuenta'

export default function DatosCuenta({ usuario, rol, onCambio }) {
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState('')
  return (
    <section className="mt-card">
      <p className="eyebrow">INFORMACIÓN PERSONAL</p>
      <h2 className="text-xl font-bold mt-2">Los datos de tu cuenta</h2>
      {aviso && (
        <p role="status" className="text-emerald-700 mt-3">
          {aviso}
        </p>
      )}
      {editando ? (
        <EditarCuenta
          usuario={usuario}
          onCancelar={() => setEditando(false)}
          onGuardado={(cuenta) => {
            onCambio(cuenta)
            setEditando(false)
            setAviso('Datos guardados correctamente.')
          }}
        />
      ) : (
        <>
          <button
            className="secondary-button mt-4"
            type="button"
            onClick={() => {
              setAviso('')
              setEditando(true)
            }}
          >
            Editar datos
          </button>
          <dl className="account-fields">
            <div>
              <dt>Nombre completo</dt>
              <dd>
                {[usuario.first_name, usuario.last_name].filter(Boolean).join(' ') ||
                  'No informado'}
              </dd>
            </div>
            <div>
              <dt>Nombre de usuario</dt>
              <dd>@{usuario.username}</dd>
            </div>
            <div>
              <dt>Correo electrónico</dt>
              <dd>{usuario.email || 'No informado'}</dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>{rol}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{usuario.telefono || 'No informado'}</dd>
            </div>
            <div>
              <dt>Domicilio de referencia</dt>
              <dd className="break-words">{usuario.domicilio_referencia || 'No informado'}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
