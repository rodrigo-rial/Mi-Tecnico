import { useEffect, useState } from 'react'

import { obtenerSesionActual } from '../services/authApi'

/**
 * Usuario logueado ({ rol, username, ... }). Si la sesión no es válida,
 * usuario queda en null y cargando en false.
 */
export function useUsuarioActual() {
  const [estado, setEstado] = useState({ usuario: null, cargando: true })

  useEffect(() => {
    let activo = true

    obtenerSesionActual()
      .then((usuario) => {
        if (activo) setEstado({ usuario, cargando: false })
      })
      .catch(() => {
        if (activo) setEstado({ usuario: null, cargando: false })
      })

    return () => {
      activo = false
    }
  }, [])

  return estado
}
