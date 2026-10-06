import { api } from './api'
import type { UsuarioLista, UsuariosPaginados } from '../types/usuarios'
import type { UsuarioSesion } from '../composables/auth/useAuthz'

export const usuariosApi = {
  listar(page: number, limit: number, busqueda: string) {
    const parametros = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (busqueda) parametros.set('q', busqueda)
    return api.get<UsuariosPaginados>(`/usuarios?${parametros.toString()}`)
  },
  cambiarEstado(id: string, estado: 'activo' | 'suspendido') {
    return api.patch<UsuarioLista>(`/usuarios/${id}/estado`, { estado })
  },
  registrar(payload: unknown) {
    return api.post('/usuarios', payload)
  },
  actualizarPerfil(payload: { nombres?: string; apellidos?: string; telefono?: string }) {
    return api.patch<UsuarioSesion>('/usuarios/me', payload)
  },
}
