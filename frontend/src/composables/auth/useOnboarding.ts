import { direccionesApi } from '../../services/direcciones'
import { disponibilidadApi } from '../../services/disponibilidad'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import type { RolUsuario } from './useAuthz'

const ESTADO_KEY = 'onboarding_completado'

export function limpiarOnboarding() {
  sessionStorage.removeItem(ESTADO_KEY)
}

export function marcarOnboardingCompletado() {
  sessionStorage.setItem(ESTADO_KEY, '1')
}

export async function necesitaOnboarding(usuario: { id: string; rol: RolUsuario }) {
  if (usuario.rol === 'admin' || sessionStorage.getItem(ESTADO_KEY) === '1') return false

  try {
    const direcciones = await direccionesApi.listar()
    if (direcciones.length === 0) return true
    if (usuario.rol === 'cliente') {
      marcarOnboardingCompletado()
      return false
    }

    const [perfil, categorias, tarifas, disponibilidad] = await Promise.all([
      perfilTecnicoApi.obtener(usuario.id),
      perfilTecnicoApi.obtenerCategorias(usuario.id),
      perfilTecnicoApi.obtenerTarifas(usuario.id),
      disponibilidadApi.listar(usuario.id),
    ])
    const incompleto =
      perfil.anios_experiencia == null ||
      perfil.radio_cobertura_km == null ||
      !perfil.biografia?.trim() ||
      categorias.length === 0 ||
      tarifas.length === 0 ||
      disponibilidad.length === 0
    if (!incompleto) marcarOnboardingCompletado()
    return incompleto
  } catch {
    return true
  }
}
