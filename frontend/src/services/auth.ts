import { api } from './api'
import type { RolUsuario, UsuarioSesion } from '../composables/auth/useAuthz'

export interface LoginResponse {
  access_token: string
  user: UsuarioSesion
}

export const authApi = {
  login(email: string, password: string) {
    return api.post<LoginResponse>('/auth/login', { email, password })
  },
  loginGoogle(idToken: string, rol?: RolUsuario) {
    return api.post<LoginResponse>('/auth/google', {
      id_token: idToken,
      ...(rol ? { rol } : {}),
    })
  },
  recuperar(email: string) {
    return api.post<{ mensaje: string }>('/auth/recuperar', { email })
  },
  validarTokenRestablecer(token: string) {
    return api.get<{ valido: boolean; motivo: 'expirado' | 'invalido' }>(
      `/auth/reset-token/validar?token=${encodeURIComponent(token)}`,
    )
  },
  restablecer(token: string, nuevaPassword: string) {
    return api.post<{ mensaje: string }>('/auth/restablecer', {
      token,
      nueva_password: nuevaPassword,
    })
  },
}
