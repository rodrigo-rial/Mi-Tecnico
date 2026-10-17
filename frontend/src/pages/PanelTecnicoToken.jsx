import PanelTecnico from './PanelTecnico'
import { obtenerAccessToken } from '../services/authApi'

export default function PanelTecnicoToken() {
  return <PanelTecnico token={obtenerAccessToken()} />
}
