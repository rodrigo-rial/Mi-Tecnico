import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import RegistroPage from './pages/RegistroPage'
import CuentaPage from './pages/CuentaPage'
import PanelTecnicoToken from './pages/PanelTecnicoToken'
import RutaProtegida from './components/RutaProtegida'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/registro"
        element={<RegistroPage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={(
          <RutaProtegida
            rolesPermitidos={['CLIENTE', 'ADMINISTRADOR']}
          />
        )}
      >
        <Route
          path="/cuenta"
          element={<CuentaPage />}
        />
      </Route>

      <Route
        element={(
          <RutaProtegida rolesPermitidos={['TECNICO']} />
        )}
      >
        <Route
          path="/tecnico"
          element={<PanelTecnicoToken />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App